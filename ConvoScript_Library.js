const cs = {
  ArrayManager: class {
    //Store all script arrays
    constructor() {
      this.arrays = {};
    }

    //Add script array
    addArray(name, initialArray) {
      if (this.arrays[name]) {
        throw new Error(`Array with name "${name}" already exists.`);
      }

      const handler = {
        //Get the most recent value that may contain an expression
        get: (target, prop) => {
          const value = Reflect.get(target, prop);

          if (
            typeof value === "string" &&
            value.startsWith("${") &&
            value.endsWith("}")
          ) {
            return this.evaluateExpression(value.slice(2, -1));
          }

          if (typeof value === "object" && value !== null) {
            return this.resolveNestedReferences(value);
          }

          return value;
        },

        set: (target, prop, value) => {
          return Reflect.set(target, prop, value);
        },
      };

      //Create proxy array that retrieves values when they are used (this allows the array to reference parts of itself and change itself (as is done in the run() function))
      const proxy = new Proxy(initialArray, handler);

      //Add proxy array
      this.arrays[name] = proxy;
      return proxy;
    }

    removeArray(name) {
      if (!this.arrays[name]) {
        throw new Error(`Array with name "${name}" does not exist.`);
      }
      delete this.arrays[name];
      console.log(`Array with name "${name}" has been removed.`);
    }

    //If a reference has been made to a script, this evaluates the expression (between ${...})
    evaluateExpression(expression) {
      try {
        const func = new Function("arrays", `return ${expression}`);
        return func(this.arrays);
      } catch (error) {
        // console.error(`Failed to evaluate expression: ${expression}`, error);
        return "${expression}";
      }
    }

    //Check the type of input and evaluate references / expressions
    resolveNestedReferences(value) {
      if (Array.isArray(value)) {
        return value.map((item) => this.resolveNestedReferences(item));
      } else if (typeof value === "object" && value !== null) {
        const resolvedObject = {};
        for (const key of Object.keys(value)) {
          const property = value[key];
          if (
            typeof property === "string" &&
            property.startsWith("${") &&
            property.endsWith("}")
          ) {
            resolvedObject[key] = this.evaluateExpression(
              property.slice(2, -1)
            );
          } else {
            resolvedObject[key] = this.resolveNestedReferences(property);
          }
        }
        return resolvedObject;
      }
      return value;
    }

    getArray(name) {
      return this.arrays[name];
    }

    getArrayName(arrayReference) {
      for (const [name, array] of Object.entries(this.arrays)) {
        if (array === arrayReference) {
          return name;
        }
      }
      throw new Error("Array not found");
    }
  },
  run: async function ({
    array,
    resultElementSelector,
    api_token,
    loadingElementSelector,
    inputElementSelector,
    acceptButtonElementSelector,
    manager,
    delayTime = 100,
  }) {
    if (typeof array === "string") {
      array = manager.getArray(array);
    }

    let returnValue = null;

    //this can likely be solved simpler
    let copiedArray = manager.addArray("opDE1Aa(!%+y.bmaPX%+mj9", [...array]);
    let managerIsCleaned = false;
    // let arrayCopy = [...array];
    // console.log(arrayCopy);

    //Harsh check to eliminate errors. Using this function without these parameters would not make sense
    if (
      !array ||
      !resultElementSelector ||
      !acceptButtonElementSelector ||
      !api_token ||
      !inputElementSelector ||
      !loadingElementSelector //loadingindicator could not be obligatory with a simple change
    ) {
      console.error(
        "not all required parameters provided. Array:",
        array,
        "api_token:",
        api_token,
        "resultElementSelector:",
        resultElementSelector,
        "inputElementSelector:",
        inputElementSelector,
        "loadingElementSelector:",
        loadingElementSelector,
        "acceptButtonElementSelector:",
        acceptButtonElementSelector
      );
      return "not all required parameters provided";
    }
    const hashtable = {
      textToText: foundry.textToText,
      textToImage: foundry.textToImage,
      textToSound: foundry.textToSound,
      soundToText: foundry.soundToText, //currently only available with type='file'
      // stopRec: foundry.stopRec,
      imageToText: foundry.imageToText,
      fileSelector: foundry.fileSelector,
      // models: foundry.models,
    };

    //system prompt is working in very little of the functions
    const systemPrompt = array[0].role === "system" ? array[0].content : "";
    const startCounter = array[0].role === "system" ? 1 : 0;

    let latestImage, latestSound, latestMessage;

    for (let i = startCounter; i < array.length; i++) {
      if (array[i]?.role === "function") {
        if (array[i]?.content === "fileSelector") {
          let response = await hashtable[array[i].content](array[i].fileType);

          //Not ideal solution. array[i] = { ...array[i], response: response} did work but was not useable in other functions somehow
          if (
            array[i].fileType === "sound" ||
            array[i].fileType === "Sound" ||
            array[i].fileType === "audio" ||
            array[i].fileType === "Audio"
          ) {
            latestSound = response;
          } else if (
            array[i].fileTYpe === "Image" ||
            array[i].fileTYpe === "image"
          ) {
            latestImage = response;
          }
        } else {
          document
            .querySelector(loadingElementSelector)
            .removeAttribute("hidden");
          let response = await hashtable[array[i].content]({
            api_token,
            image: latestImage,
            file: latestSound,
            prompt: latestMessage,
            systemPrompt, //only works in imageToText
            logging: false,
            ...array[i],
          });
          document
            .querySelector(loadingElementSelector)
            .setAttribute("hidden", "");

          array[i] = { ...array[i], response: response };
          if (array[i].content === "textToImage") {
            latestImage = response;
            document
              .querySelector(resultElementSelector)
              .insertAdjacentHTML(
                "beforeend",
                `<p>Assistant: </p><img src="${response}" />`
              );
          } else if (array[i].content === "textToSound") {
            latestSound = response;
            document
              .querySelector(resultElementSelector)
              .insertAdjacentHTML(
                "beforeend",
                `<p>Assistant: </p><audio controls src="${response}" />`
              );
          } else if (array[i].content === "fileSelector") {
            document
              .querySelector(resultElementSelector)
              .insertAdjacentHTML("beforeend", `<p>User: File Selected</p>`);
          } else {
            latestMessage = response;
            document
              .querySelector(resultElementSelector)
              .insertAdjacentHTML("beforeend", `<p>Assistant: ${response}</p>`);
          }
        }
      } else if (array[i].role === "condition") {
        try {
          if (eval(array[i].content)) {
            cleanUpManager();

            this.run({
              array: array[i].true,
              resultElementSelector,
              api_token,
              loadingElementSelector,
              inputElementSelector,
              acceptButtonElementSelector,
              manager,
            });

            break;
          } else {
            cleanUpManager();

            this.run({
              array: array[i].false,
              resultElementSelector,
              api_token,
              loadingElementSelector,
              inputElementSelector,
              acceptButtonElementSelector,
              manager,
            });
          }

          break;
        } catch (err) {
          console.error("An issue occurred in your condition", err);
          try {
            cleanUpManager();

            this.run({
              array: array[i].false,
              resultElementSelector,
              api_token,
              loadingElementSelector,
              inputElementSelector,
              acceptButtonElementSelector,
              manager,
            });
            break;
          } catch (err) {
            console.error("An issue occurred in your condition");
          }
        }
      } else if (array[i].content?.content === "input") {
        let msg = await waitForUserInput(array[i].content?.type);
        if (array[i].content?.type === "text") {
          latestMessage = msg;
          document
            .querySelector(resultElementSelector)
            .insertAdjacentHTML("beforeend", `<p>${array[i].role}: ${msg}</p>`);
          array[i].content = msg;
        }
        if (array[i].content?.type === "image") {
          latestImage = msg;
          document
            .querySelector(resultElementSelector)
            .insertAdjacentHTML(
              "beforeend",
              `<p>${array[i].role}:</p><img src="${msg}" />`
            );
        }
        if (
          array[i].content?.type === "sound" ||
          array[i].content?.type === "audio"
        ) {
          latestSound = msg;
          document
            .querySelector(resultElementSelector)
            .insertAdjacentHTML(
              "beforeend",
              `<p>${array[i].role}:</p><audio controls src="${msg}" />`
            );
        }
        array[i] = { ...array[i], content: msg };
      } else if (array[i].role === "return") {
        returnValue = { ...array[i] };
      } else {
        document
          .querySelector(resultElementSelector)
          .insertAdjacentHTML(
            "beforeend",
            `<p>${array[i].role}: ${array[i].content}</p>`
          );
        latestMessage = array[i].content;
      }
      await delay(delayTime);
      window.scrollTo(0, document.body.scrollHeight);
    }

    //something like this
    // console.log([...array], [...arrayCopy]);
    // array = arrayCopy;
    // manager.setArray(array, copiedArray);

    cleanUpManager();

    return returnValue;

    function cleanUpManager() {
      if (!managerIsCleaned) {
        let arrayName = manager.getArrayName(array);
        manager.removeArray(arrayName);
        manager.addArray(arrayName, copiedArray);
        manager.removeArray("opDE1Aa(!%+y.bmaPX%+mj9");
        managerIsCleaned = true;
      }
    }

    function waitForUserInput(type) {
      return new Promise((resolve) => {
        if (type === "text") {
          document
            .querySelector(inputElementSelector)
            .setAttribute("type", type); //show input
          document
            .querySelector(acceptButtonElementSelector)
            .removeAttribute("hidden"); //show button
          document.querySelector(acceptButtonElementSelector).onclick =
            async function () {
              resolve(document.querySelector(inputElementSelector).value); //resolve
              document
                .querySelector(acceptButtonElementSelector)
                .setAttribute("hidden", ""); //remove button
              document
                .querySelector(inputElementSelector)
                .setAttribute("type", "hidden"); //remove input
            };
        } else if (type === "image" || type === "audio" || type === "sound") {
          document
            .querySelector(acceptButtonElementSelector)
            .removeAttribute("hidden");
          document.querySelector(acceptButtonElementSelector).onclick =
            async function () {
              let file = await foundry.fileSelector(type);
              resolve(file);
              document
                .querySelector(acceptButtonElementSelector)
                .setAttribute("hidden", "");
            };
        }
      });
    }

    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  },
};
