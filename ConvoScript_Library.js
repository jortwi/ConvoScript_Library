class ConvoScript {
  //Store all script arrays
  constructor({
    resultElementSelector,
    api_token,
    loadingElementSelector,
    inputElementSelector,
    acceptButtonElementSelector,
    delayTime = 100,
  }) {
    if (
      [
        resultElementSelector,
        api_token,
        loadingElementSelector,
        inputElementSelector,
        acceptButtonElementSelector,
      ].some((param) => param === undefined || param === null)
    ) {
      throw new Error(
        `Not all required parameters provided: api_token: ${api_token}, resultElementSelector: ${resultElementSelector}, loadingElementSelector: ${loadingElementSelector}, inputElementSelector: ${inputElementSelector}, acceptButtonElementSelector: ${acceptButtonElementSelector}`
      );
    }

    this.arrays = {};
    this.resultElementSelector = resultElementSelector;
    this.api_token = api_token;
    this.loadingElementSelector = loadingElementSelector;
    this.inputElementSelector = inputElementSelector;
    this.acceptButtonElementSelector = acceptButtonElementSelector;
    this.delayTime = delayTime;
  }

  //Add script array
  addScript(name, initialArray) {
    initialArray = JSON.parse(JSON.stringify(initialArray)); //make a deep copy of the input to prevent functions from affecting the input itself
    if (this.arrays[name]) {
      throw new Error(`Script with name "${name}" already exists.`);
    }
    if (name?.toLowerCase() === "end") {
      throw new Error(`Illegal script name provided: ${name}`);
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

  removeScript(name) {
    if (!this.arrays[name]) {
      throw new Error(`Script with name "${name}" does not exist.`);
    }
    delete this.arrays[name];
  }

  //If a reference has been made to a script, this evaluates the expression (between ${...})
  evaluateExpression(expression) {
    // console.log(expression);
    try {
      const func = new Function("arrays", `return ${expression}`);
      return func(this.arrays);
    } catch (error) {
      console.error(`Failed to evaluate expression: ${expression}`, error);
      return expression; //this may not work
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
          resolvedObject[key] = this.evaluateExpression(property.slice(2, -1));
        } else {
          resolvedObject[key] = this.resolveNestedReferences(property);
        }
      }
      return resolvedObject;
    }
    return value;
  }

  getScript(name) {
    return this.arrays[name];
  }

  getScriptName(arrayReference) {
    for (const [name, array] of Object.entries(this.arrays)) {
      if (array === arrayReference) {
        return name;
      }
    }
    throw new Error("Script not found");
  }

  async run(array) {
    console.log("starting run function");
    let manager = this;
    if (typeof array === "string") {
      array = manager.getScript(array);
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

    let latestImage, latestSound, latestMessage;

    for (let i = 0; i < array.length; i++) {
      if (array[i]?.role?.toLowerCase() === "function") {
        if (array[i]?.content === "fileSelector") {
          let response = await hashtable[array[i].content](array[i].fileType);

          //Not ideal solution. array[i] = { ...array[i], response: response} did work but was not useable in other functions somehow
          if (
            array[i].fileType?.toLowerCase() === "sound" ||
            array[i].fileType?.toLowerCase() === "Sound" ||
            array[i].fileType?.toLowerCase() === "audio" ||
            array[i].fileType?.toLowerCase() === "Audio"
          ) {
            latestSound = response;
          } else if (
            array[i].fileTYpe?.toLowerCase() === "Image" ||
            array[i].fileTYpe?.toLowerCase() === "image"
          ) {
            latestImage = response;
          }
        } else {
          document
            .querySelector(this.loadingElementSelector)
            .removeAttribute("hidden");
          let response = await hashtable[array[i].content]({
            api_token: this.api_token,
            image: latestImage,
            file: latestSound,
            prompt: latestMessage,
            logging: false,
            ...array[i],
          });
          document
            .querySelector(this.loadingElementSelector)
            .setAttribute("hidden", "");

          array[i] = { ...array[i], response: response };
          if (array[i].content === "textToImage") {
            latestImage = response;
            document
              .querySelector(this.resultElementSelector)
              .insertAdjacentHTML(
                "beforeend",
                `<p>Assistant: </p><img src="${response}" />`
              );
          } else if (array[i].content === "textToSound") {
            latestSound = response;
            document
              .querySelector(this.resultElementSelector)
              .insertAdjacentHTML(
                "beforeend",
                `<p>Assistant: </p><audio controls src="${response}" />`
              );
          } else if (array[i].content === "fileSelector") {
            document
              .querySelector(this.resultElementSelector)
              .insertAdjacentHTML("beforeend", `<p>User: File Selected</p>`);
          } else {
            latestMessage = response;
            document
              .querySelector(this.resultElementSelector)
              .insertAdjacentHTML("beforeend", `<p>Assistant: ${response}</p>`);
          }
        }
      } else if (array[i].role?.toLowerCase() === "condition") {
        try {
          if (eval(array[i].content)) {
            if (array[i].true?.toLowerCase() === "end") {
              break;
            }

            await this.run(array[i].true);

            break;
          } else {
            if (array[i].false?.toLowerCase() === "end") {
              break;
            }

            await this.run(array[i].false);
          }

          break;
        } catch (err) {
          console.error(
            "An issue occurred in your condition",
            err,
            "condition: ",
            array[i].content
          );
          try {
            //try again without eval()
            if (array[i].content) {
              if (array[i].true?.toLowerCase() === "end") {
                break;
              }

              await this.run(array[i].true);

              break;
            } else {
              if (array[i].false?.toLowerCase() === "end") {
                break;
              }

              await this.run(array[i].false);
              break;
            }
          } catch (err) {
            console.error("An issue occurred in your condition");
            try {
              //try array[i].false if the condition does not work

              if (array[i].false?.toLowerCase() === "end") {
                break;
              }

              await this.run(array[i].false);
              break;
            } catch (err) {
              console.error("An issue occurred in your condition");
              break;
            }
          }
        }
      } else if (array[i].content?.content?.toLowerCase() === "input") {
        let msg = await this.waitForUserInput(array[i].content?.type);
        if (array[i].content?.type?.toLowerCase() === "text") {
          latestMessage = msg;
          document
            .querySelector(this.resultElementSelector)
            .insertAdjacentHTML(
              "beforeend",
              `<p>${this.addCap(array[i].role)}: ${msg}</p>`
            );
          array[i] = { ...array[i], content: msg };
        }
        if (array[i].content?.type?.toLowerCase() === "image") {
          latestImage = msg;
          document
            .querySelector(this.resultElementSelector)
            .insertAdjacentHTML(
              "beforeend",
              `<p>${this.addCap(array[i].role)}:</p><img src="${msg}" />`
            );
        }
        if (
          array[i].content?.type?.toLowerCase() === "sound" ||
          array[i].content?.type?.toLowerCase() === "audio"
        ) {
          latestSound = msg;
          document
            .querySelector(this.resultElementSelector)
            .insertAdjacentHTML(
              "beforeend",
              `<p>${this.addCap(
                array[i].role
              )}:</p><audio controls src="${msg}" />`
            );
        }
        array[i] = { ...array[i], content: msg };
      } else {
        document
          .querySelector(this.resultElementSelector)
          .insertAdjacentHTML(
            "beforeend",
            `<p>${this.addCap(array[i].role)}: ${array[i].content}</p>`
          );
        latestMessage = array[i].content;
      }
      await delay(this.delayTime);
      window.scrollTo(0, document.body.scrollHeight);
    }

    return manager.arrays;

    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  waitForUserInput(type) {
    return new Promise((resolve) => {
      if (type?.toLowerCase() === "text") {
        document
          .querySelector(this.inputElementSelector)
          .setAttribute("type", type); //show input
        document
          .querySelector(this.acceptButtonElementSelector)
          .removeAttribute("hidden"); //show button
        document.querySelector(this.acceptButtonElementSelector).onclick =
          () => {
            console.log(
              document.querySelector(this.inputElementSelector).value
            );
            resolve(document.querySelector(this.inputElementSelector).value); //resolve
            document
              .querySelector(this.acceptButtonElementSelector)
              .setAttribute("hidden", ""); //remove button
            document
              .querySelector(this.inputElementSelector)
              .setAttribute("type", "hidden"); //remove input
          };
      } else if (
        type?.toLowerCase() === "image" ||
        type?.toLowerCase() === "audio" ||
        type?.toLowerCase() === "sound"
      ) {
        document
          .querySelector(this.acceptButtonElementSelector)
          .removeAttribute("hidden");
        document.querySelector(this.acceptButtonElementSelector).onclick =
          async function () {
            let file = await foundry.fileSelector(type);
            resolve(file);
            document
              .querySelector(this.acceptButtonElementSelector)
              .setAttribute("hidden", "");
          };
      }
    });
  }

  addCap(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }
}
