const foundry = {
  textToText: async function ({
    api_token,
    model = "hermes-2-pro-llama-3-8b",
    server = "https://data.id.tue.nl",
    prompt,
    messages,
    temperature = 0.9,
    max_tokens = 500,
    logging = true,
    loadingElementSelector,
    resultElementSelector,
  }) {
    if (!api_token) {
      //Do not run the function when no API key is given
      console.error("No API key provided.");
      return;
    }

    if (logging) {
      console.log("Running text-to-text function");
    }

    //Create message for request
    if (!messages) {
      if (!prompt) {
        console.error("No prompt given. Empty message created.");
        prompt = "";
      }
      messages = [
        //Create a message for LocalAI
        {
          role: "user",
          content: prompt,
        },
      ];
    }

    try {
      //Start the loading indicator
      if (loadingElementSelector) {
        if (document.querySelector(loadingElementSelector)) {
          document
            .querySelector(loadingElementSelector)
            .setAttribute("aria-busy", "true");
        } else {
          console.error("Element selected for loading indicator not found");
        }
      }
      //Send messages to LocalAI
      const response = await fetch(`${server}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api_token}`,
        },
        body: JSON.stringify({
          messages: messages,
          model: model,
          temperature: temperature,
          max_tokens: max_tokens,
        }),
      });

      //Wait for LocalAI response
      const json = await response.json();

      // json.content contains the generated chat response
      let chatResponse = json.choices[0].message.content;
      if (logging) {
        console.log("Result:", chatResponse);
      }

      //Place result on the page
      if (resultElementSelector) {
        document.querySelector(resultElementSelector).innerHTML += chatResponse;
      }

      //Stop loading indicator
      if (loadingElementSelector) {
        if (document.querySelector(loadingElementSelector)) {
          document
            .querySelector(loadingElementSelector)
            .setAttribute("aria-busy", "false");
        } else {
          console.error("Element selected for loading indicator not found");
        }
      }

      //Return the AI response
      return chatResponse;
    } catch (error) {
      console.error("Error:", error);
    }
  },
  textToImage: async function ({
    api_token,
    server = "https://data.id.tue.nl",
    prompt,
    temperature = 0.9,
    logging = true,
    loadingElementSelector,
    resultElementSelector,
    steps = 20,
    width = 512,
    height = 512,
  }) {
    if (logging) {
      console.log("Running text-to-image function");
    }
    //Do not run the function when no API key is given
    if (!api_token) {
      console.error("No API key provided.");
      return;
    }

    try {
      //add loading indicator
      if (loadingElementSelector) {
        if (document.querySelector(loadingElementSelector)) {
          document
            .querySelector(loadingElementSelector)
            .setAttribute("aria-busy", "true");
        } else {
          console.error("Element selected for loading indicator not found");
        }
      }

      //Make AI request
      const response = await fetch(`${server}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api_token}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          steps: steps,
          width: width,
          height: height,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (logging) {
        console.log("Generated image:", data["image_url"]);
      }

      //If a result element has been provided (which should be an <img> element, place the result)
      if (resultElementSelector) {
        document.querySelector(resultElementSelector).src = data["image_url"];
      }

      //Stop loading indicator
      if (loadingElementSelector) {
        if (document.querySelector(loadingElementSelector)) {
          document
            .querySelector(loadingElementSelector)
            .setAttribute("aria-busy", "false");
        } else {
          console.error("Element selected for loading indicator not found");
        }
      }

      //return the result
      return data["image_url"];
    } catch (error) {
      console.error(
        "There was a problem with the fetch operation:",
        error.message
      );
    }
  },
  textToSound: async function ({
    api_token,
    server = "https://data.id.tue.nl",
    projectId,
    prompt,
    language = "en",
    loadingElementSelector,
    resultElementSelector,
    logging = true,
  }) {
    if (!api_token) {
      //Do not run the function when no API key has been provided
      console.error("No API key provided.");
      return;
    }

    if (!projectId) {
      //Do not run the function when no project ID has been provided
      console.error(
        "No project ID provided. Please find your project ID at the info section of your project."
      );
      return;
    }

    if (logging) {
      console.log("Running text-to-sound function");
    }

    if (loadingElementSelector) {
      if (document.querySelector(loadingElementSelector)) {
        document
          .querySelector(loadingElementSelector)
          .setAttribute("aria-busy", "true");
      } else {
        console.error("Element selected for loading indicator not found");
      }
    }

    try {
      const response = await fetch(`${server}/api/vendor/t2s/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_token: api_token,
          lang: language,
          text: prompt,
        }),
      });
      const json = await response.json();
      const audioLink = "https://data.id.tue.nl/api/vendor/t2s/" + json.text;
      if (logging) {
        console.log("Generated audio:", audioLink);
      }
      if (json.text === undefined) {
        console.error(
          "No result. It is possible your API Key and project ID are not matching."
        );
      }
      if (loadingElementSelector) {
        if (document.querySelector(loadingElementSelector)) {
          document
            .querySelector(loadingElementSelector)
            .setAttribute("aria-busy", "false");
        } else {
          console.error("Element selected for loading indicator not found");
        }
      }
      if (resultElementSelector) {
        document.querySelector(resultElementSelector).src = audioLink;
      }

      return audioLink;
    } catch (err) {
      console.error(err);
    }
  },
  imageToText: async function ({
    api_token,
    model = "llava-llama-3-8b-v1_1",
    server = "https://data.id.tue.nl",
    prompt,
    systemPrompt,
    image,
    temperature = 0.9,
    max_tokens = 500,
    logging = true,
    loadingElementSelector,
    resultElementSelector,
  }) {
    if (!api_token) {
      //Do not run the function when no API key has been provided
      console.error("No API key provided.");
      return;
    }

    if (!image) {
      console.error("No image provided!");
    }

    if (logging) {
      console.log("Running image-to-text function");
    }
    image = await foundry.processImage(image);
    messages = [
      //Create a message for LocalAI
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: image },
          },
        ],
      },
    ];

    try {
      //Start the loading indicator
      if (loadingElementSelector) {
        if (document.querySelector(loadingElementSelector)) {
          document
            .querySelector(loadingElementSelector)
            .setAttribute("aria-busy", "true");
        } else {
          console.error("Element selected for loading indicator not found");
        }
      }
      //Send messages to LocalAI
      const response = await fetch(`${server}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api_token}`,
        },
        body: JSON.stringify({
          messages: messages,
          model: model,
          temperature: temperature,
          max_tokens: max_tokens,
        }),
      });

      //Wait for LocalAI response
      const json = await response.json();

      // json.content contains the generated chat response
      let chatResponse = json.choices[0].message.content;

      if (logging) {
        console.log("Result:", chatResponse);
      }

      //Place result on the page
      if (resultElementSelector) {
        document.querySelector(resultElementSelector).innerHTML += chatResponse;
      }

      //Stop loading indicator
      if (loadingElementSelector) {
        if (document.querySelector(loadingElementSelector)) {
          document
            .querySelector(loadingElementSelector)
            .setAttribute("aria-busy", "false");
        } else {
          console.error("Element selected for loading indicator not found");
        }
      }

      //Return the AI response
      return chatResponse;
    } catch (error) {
      console.error("Error:", error);
    }
  },
  soundToText: async function ({
    api_token,
    server = "https://data.id.tue.nl",
    model = "whisper-base",
    type = "file", //'file' or 'record'
    sliceDuration = 5000, //miliseconds
    file, //The audio file that needs to be transcribed
    resultElementSelector, //Element that will be used to place the result on the page
    loadingElementSelector, //Element that will be given a loading indicator attribute when the AI is working
    logging = true, //Set to false to remove console logging
    stopRec = false, //In order to stop the recording, pass isRecording = true
  }) {
    //If the function is instructed to stop recording, do so and return a transcription of the complete recording
    if (stopRec) {
      let res = await stopRecording();
      return res;
    }

    if (!api_token) {
      //Do not run the function when no API key has been provided
      console.error("No API key provided.");
      return;
    }

    //Variable that will get larger each time a new part of the recording is created. How often this happens depends on the sliceDuration
    let transcription = "";

    //In record mode, start the recording
    if (type === "record") {
      startRecording();
    }

    //In file mode, transcribe the provided file without a popup. Can be used if file selection needs to be handled differently.
    if (type === "file") {
      return await df_transcribe({
        api_token: api_token,
        model: model,
        file: file,
      });
    }

    //Helper functions

    function startRecording() {
      //Use RecordRTC library to handle microphone recordings
      //First, check if RecordRTC is present, otherwise add this library to the page using a CDN link HTML element
      loadRecordRTC(function () {
        navigator.mediaDevices
          .getUserMedia({
            audio: true,
          })
          .then(function (stream) {
            recordAudio = RecordRTC(stream, {
              type: "audio",
              mimeType: "audio/webm",
              sampleRate: 44100,
              recorderType: StereoAudioRecorder,
              numberOfAudioChannels: 1,
              desiredSampRate: 16000,
              timeSlice: sliceDuration, //Duration of time slices (miliseconds) of transcriptions
              disableLogs: !logging, //Disable logging is logging is set to false

              ondataavailable: async function (blob) {
                //Add the result to transcription variable
                transcription += await df_transcribe({
                  api_token: api_token,
                  model: model,
                  file: blob,
                });

                if (logging) {
                  console.log("Transcription:", transcription); //Log the transcription
                }

                //Place resulting transcription on the page
                if (resultElementSelector) {
                  document.querySelector(resultElementSelector).innerHTML +=
                    transcription;
                }
              },
            });
            recordAudio.startRecording();
          })
          .catch((err) => {
            // always check for errors at the end.
            console.error(`${err.name}: ${err.message}`);
          });
      });
    }

    //Function to stop recording and create a new transcription of the complete recording instead of using slices
    async function stopRecording() {
      return new Promise((resolve) => {
        recordAudio.stopRecording(async function () {
          var blob = recordAudio.getBlob();

          //Allow the option to not give an api token while running foundry.stopRec(), and then return an empty string (and not place the result on screen)
          let completeTranscription = "";
          if (api_token) {
            completeTranscription = await df_transcribe({
              api_token: api_token,
              model: model,
              file: blob,
              type: "file",
            });

            //Place result on screen
            if (resultElementSelector) {
              document.querySelector(resultElementSelector).innerHTML +=
                completeTranscription;
            }
          }

          resolve(completeTranscription);
        });
      });
    }
    //This function is used to transcribe audio. It will return text.
    async function df_transcribe({ model, file }) {
      //Create FormData object and append the file and other parameters
      const formData = new FormData();
      formData.append("model", model); //Add model
      formData.append("file", file); //Add uploaded or provided file

      try {
        //Add loading indicator
        if (loadingElementSelector) {
          if (document.querySelector(loadingElementSelector)) {
            document
              .querySelector(loadingElementSelector)
              .setAttribute("aria-busy", "true");
          } else {
            console.error("Element selected for loading indicator not found");
          }
        }
        //Make request
        const response = await fetch(`${server}/v1/audio/transcriptions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${api_token}`,
          },
          body: formData,
        });
        const result = await response.json(); //It may occur that the reponsonse is not perfect json, leading to errors
        if (logging) {
          //log result
          console.log("Result:", result.text);
        }

        //Remove loading indicator
        if (loadingElementSelector) {
          if (document.querySelector(loadingElementSelector)) {
            document
              .querySelector(loadingElementSelector)
              .setAttribute("aria-busy", "false");
          } else {
            console.error("Element selected for loading indicator not found");
          }
        }

        //return result
        return result.text;
      } catch (error) {
        console.error(error.message);
      }
    }

    //In order to make use of the RecordRTC library, check if this library is available, and add it if that is not the case. Then, use RecordRTC functionality
    function loadRecordRTC(callback) {
      // Check if RecordRTC is already available
      if (typeof RecordRTC !== "undefined") {
        if (logging) {
          console.log("RecordRTC is already loaded.");
        }
        callback(); //If loaded, run the callback
      } else {
        if (logging) {
          console.log("RecordRTC is not loaded, adding script to the page.");
        }
        //Create a script element to load RecordRTC from CDN
        var script = document.createElement("script");
        script.src = "https://cdn.webrtc-experiment.com/RecordRTC.js";
        script.async = true;

        //Set up callback when the script is loaded
        script.onload = function () {
          if (logging) {
            console.log("RecordRTC has been loaded.");
          }
          callback();
        };

        //Append script to the head of the document
        document.head.appendChild(script);
      }
    }
  },
  stopRec: async function ({
    api_token,
    server = "https://data.id.tue.nl",
    logging = true,
    loadingElementSelector,
    resultElementSelector,
  }) {
    if (api_token) {
      return await foundry.soundToText({
        api_token: api_token,
        server,
        stopRec: true,
        logging: logging,
        loadingElementSelector,
        resultElementSelector,
      });
    } else {
      return await foundry.soundToText({
        stopRec: true,
        server,
        logging: logging,
        loadingElementSelector,
        resultElementSelector,
      });
    }
  },
  models: async function (api_token, server = "https://data.id.tue.nl") {
    if (!api_token) {
      console.error("No api token provided!");
      return "No api token provided!";
    }
    try {
      const response = await fetch(`${server}/v1/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api_token}`,
        },
      });
      //Wait for LocalAI response
      const json = await response.json();
      const models = json.data;
      console.log("Models:", models);
      return models;
    } catch (err) {
      console.error(err);
    }
  },
  fileSelector: async function (type, logging = true) {
    //If not file input had already been created, create a new one
    if (!document.querySelector("#df_hiddenFileInput")) {
      document.body.innerHTML += `<input type="file" id="df_hiddenFileInput" style="display: none;" onchange=""></input>`;
    }

    //If types audio / image have been selected, add 'accept' attribute and set to the correct value
    //If no type has been provided, remove this attribute, as it may have been set previously
    if (type === "audio" || type === "sound") {
      document
        .querySelector("#df_hiddenFileInput")
        .setAttribute("accept", "audio/*");
    } else if (type === "image") {
      document
        .querySelector("#df_hiddenFileInput")
        .setAttribute("accept", "image/*");
    } else {
      document.querySelector("#df_hiddenFileInput").removeAttribute("accept");
    }

    //Activate the file input.
    document.querySelector("#df_hiddenFileInput").click();

    try {
      let file = await df_waitForFileSelection();
      return file;
    } catch (err) {
      console.error(err);
    }

    function df_waitForFileSelection() {
      return new Promise((resolve, reject) => {
        const fileInput = document.querySelector("#df_hiddenFileInput");

        //Check if file input exists
        if (!fileInput) {
          reject(new Error("File input element not found"));
          return;
        }

        //Event listener for file selection
        fileInput.onchange = async function (event) {
          const files = event.target.files;

          if (files && files.length > 0) {
            const selectedFile = files[0];
            if (logging) {
              console.log("File selected:", selectedFile);
            }

            if (selectedFile.type.startsWith("image/")) {
              try {
                let image = await foundry.processImage(selectedFile, logging);
                resolve(image);
              } catch (error) {
                reject(new Error("Error during image processing"));
              }
            } else {
              resolve(selectedFile);
            }
          }
        };
      });
    }
  },
  transcribeRecording: async function ({
    api_token,
    server,
    model,
    sliceDuration,
    resultElementSelector,
    loadingElementSelector,
    logging,
    stopRec,
  }) {
    return await foundry.soundToText({
      api_token,
      server,
      model,
      type: "record",
      sliceDuration,
      resultElementSelector,
      loadingElementSelector,
      logging,
      stopRec,
    });
  },
  transcribeFile: async function ({
    api_token,
    server,
    model,
    file,
    resultElementSelector,
    loadingElementSelector,
    logging,
  }) {
    return await foundry.soundToText({
      api_token,
      server,
      model,
      type: "file",
      file,
      resultElementSelector,
      loadingElementSelector,
      logging,
    });
  },
  processImage: async function (source, logging = true) {
    return new Promise((resolve, reject) => {
      //if the source is a File (Blob), use FileReader
      if (source instanceof File) {
        const reader = new FileReader();

        reader.onload = function (e) {
          const img = new Image();
          img.src = e.target.result;

          img.onload = async function () {
            let processedImage = await df_processImageLogic(img);
            resolve(processedImage);
          };

          img.onerror = function () {
            reject(new Error("Error loading image from file"));
          };
        };

        reader.onerror = function () {
          reject(new Error("Error reading the image file"));
        };

        //Start reading the file as a Data URL
        reader.readAsDataURL(source);
      }
      //if the source is a URL, directly process the image
      else if (typeof source === "string") {
        const img = new Image();
        img.crossOrigin = "Anonymous"; //Handle CORS if necessary
        img.src = source;

        img.onload = async function () {
          let processedImage = await df_processImageLogic(img);
          resolve(processedImage);
        };

        img.onerror = function () {
          reject(new Error("Error loading image from URL"));
        };
      } else {
        reject(new Error("Invalid image source"));
      }
    });

    function df_processImageLogic(img) {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        //Reduce the image size
        const maxWidth = 800;
        const maxHeight = 800;

        let width = img.width;
        let height = img.height;

        //Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height); //Draw the image onto the canvas

        // Get the data URL
        const processedImage = canvas.toDataURL("image/jpeg", 0.5); //0.5 reduces image quality to decrease the prompt length
        if (logging) {
          console.log("Image processed.");
          console.log(processedImage);
        }
        resolve(processedImage);
      });
    }
  },
};
