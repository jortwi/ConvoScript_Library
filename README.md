# ConvoScript_Library

Add Human-AI conversation to you web page easily!

## Introduction

This library allows users to specify a Human-AI conversation in a simple format, that will be dynamically placed on the page. Multiple scripts can be created that can refer to other scripts or themselves.

This library was developed by Jort Wiersma, coached by Mathias Funk, at the Department of Industrial Design at Eindhoven University of Technology.

## How to install

First, download the ConvoScript.js library, as well as the AI-Foundry library (latest version available on https://github.com/jortwi/AI-Foundry-Library ). Then, place the file inside of the folder where you HTML file is hosted. Inside of your HTML file, in the head element, create a script-tag that refers to the library file. E.g. `<script src="./ConvoScript.js"></script>`

## How to use

First, we create a conversation. Here, we need to provide different parameters: we need somewhere to place the conversation, a loading indicator, an input element, and a button - but also an API token. This API token can be created in Data Foundry

```
const convoScript = new ConvoScript({
            api_token: api_token, //your data foundry api token
            resultElementSelector: '#placeResults', //the HTML element where the conversation will be placed
            loadingElementSelector: '#load', //the HTML element that shows a loading icon when waiting for AI requests
            inputElementSelector: '#input', //the HTML input element that is used by the user to give input
            acceptButtonElementSelector: '#btn', //the HTML button that is used to send user messages
            delayTime: 500, //A delay after every message that can help distinguish incoming messages
        })
```

The elementSelectors should link to an HTML element on the page:

```
<div id="placeResults"></div>
<progress hidden id="load"></progress>
<input id="input" type="hidden"></input>
<button hidden id="btn">Send</button>
```

Then, we add a script:

```
script1 = convoScript.addScript('script1', [
    {
        role: 'assistant',
        content: 'Hi, how are you today?'
    },
    {
        role: 'user',
        content: 'I am fine, thanks.'
    }
])
```

Such a script contains messages that have (at least) a role and content. On the screen, this will display as:

- assistant: Hi, how are you today?
- user: I am fine, thanks.

Then, we can start the program:

```
convoScript.run(script1)
```

Different message types are available: regular messages, user inputs, and AI requests. In addition, two other 'messages' are available that do not show up directly in the conversation. The first is a condition: depending on if the condition is true or false, a different script will run. The second contains javascript code that will run when we arrive at this message.

Below, you can find more information on specific options to use in your conversations. For complete examples, please find the examples folder above.

### Message types

A regular message

```
{
    role: 'speaker',
    content: 'Hi, I like to speak'
}
```

A user input

```
{
    role: 'user',
    content: {content: 'input', type: 'text'}
}
```

An AI request - the result of which is displayed in the screen (the 'assistant' says this)

```
{
    role: 'function',
    content: 'textToText',
    prompt: 'Tell me everything you know about the wild west'
}
```

### User input

You may want to use the user input as the prompt. To do that, we can reference the part of the script where a user has provided this input. Such a reference must be written in a specific format: `"${here}"`. The reference to the first message in `script1` would be: `"${script1[0]}"`, and the reference to the content of the second message in `script1` would be: `"${script1[1].content}"`. Make sure to use regular apostrophes ", and not backticks \`.

```
script1 = convoScript.addScript('script1', [
    {
        role: 'user',
        content: {content: 'input', type: 'text'}
    },
    {
        role: 'function',
        content: 'textToText',
        messages: ['${script1[0]}']
    }
])
```

There are different types of user inputs: `text`, `audio`, `image`, and `transcription`

```
{
    role: 'user',
    content: {content: 'input', type: 'text'}
}
```

When using `audio` or `image` as input type, make sure that if you use this input the audio or image will also be processed correctly. The most common way to do that is to use the input in a function: `soundToText` for `audio` inputs, and `imageToText` for `image` inputs

```
script1 = convoScript.addScript('script1', [
    {
        role: 'user',
        content: {content: 'input', type: 'audio'}
    },
    {
        role: 'function',
        content: 'soundToText',
        prompt: '${script1[0].content}'
    }
])
```

The `transcription` input type will accept audio, but it will not result in audio output. Instead, it will immediately transcribe the input, and have text as output

```
script1 = convoScript.addScript('script1', [
    {
        role: 'user',
        content: {content: 'input', type: 'transcription'}
    },
    {
        role: 'function',
        content: 'textToImage',
        prompt: '${script1[0].content}'
    }
])
```

### Conditions

It is possible to have multiple scripts, and switch to one of those depending on e.g. the user input. For that we can write a condition. If it is true, the program will run script2, otherwise it will run script3:

```
script1 = convoScript.addScript('script1', [
    {
        role: 'user',
        content: {content: 'input', type: 'text'}
    },
    {
        role: 'condition',
        content: '${script1[0].content.includes("yes")}',
        true: 'script2',
        false: 'script3'
    }
])
```

It is possible to let a condition 'message' end the conversation. In the next example, we see that if the condition is true, end conversation ends:

```
script1 = convoScript.addScript('script1', [
    {
        role: 'user',
        content: {content: 'input', type 'text'}
    },
    {
        role: 'condition',
        content: '${script1[0].content.includes("yes")}',
        true: 'end',
        false: 'script3'
    }
])
```

### JavaScript Code during a conversation

In some cases, you may want the conversation to affect parts of the page, other functionality, or external devices while the conversation is still in progress. In these cases, you can write a JavaScript expression using `role: "code"`. The `content` of this message is regular JavaScipt. This means we do not need to use `${}` to write expressions.

```
script1 = convoScript.addScript('script1', [
    {
        role: 'user',
        content: {content: 'input', type: 'text'}
    },
    {
        role: 'code',
        content: 'console.log("Wow! This is our first contact with the user:"); console.log(script1[0]);'
        //This code will be executed without directly affecting the conversation
    }
])
```

### After the conversation

If you want to use a certain part of the conversation for a different purpose on you page, you can do so as the `run()` function returns all scripts:

```
async function start() {
    script1 = convoScript.addScript('script1', [
    {
        role: 'user',
        content: {content: 'input', type: 'text'}
    },
    {
        role: 'function',
        content: 'textToText',
        messages: ['${script1[0]}']
    }
    ])

    let res = await convoScript.run(script1)
    console.log(res.script1[0].content) //Log the user input in script1 to the console
}
```

## Debug tips

- Check the console in the browser for errors! Right click > Inspect (element) > Console. In some browsers, the console has an icon that looks like a coding interface.
- Make sure your scripts are global variables. Otherwise they are not accessible during the conversation
- Do not use backticks (\`) but apostrophes ("/') when writing expressions in your conversation: `prompt: "${script1[0].content}"`
- Check for typos in your roles. `role: "finction"` will not work
- If issues persist, you can take a look at all of your scripts by running `convoScript.arrays` in the console (This assumes your ConvoScript instance is called `convoScript`). Make sure the conversation is in progrress when you do this.
- Take a look at the examples in the example folder for inspiration, and compare with your own code to find errors
- When AI requests do not behave the way you expected (`role: 'function'`), take a look at https://github.com/jortwi/AI-Foundry-Library for more information on these AI requests
- the `messages` property should be an array. Notice the difference between `messages: ['${script1[0]}']` (correct) and `messages: '${script1[0]}'` (incorrect)
- If you find issues in sound transcription, it could be because the audio file you are transcribing is too large
- If you are using a condition, make sure you provide a script to run for both the condition being true and false. If you need only one, you can set the other to 'end' (`true: "end"`). This will stop the conversation if the condition is true.
- if you are using the 'code' role (`role: 'code'`), make sure the provided JavaScript code is valid. If you want to refer to one of the scripts, do not use the `"${script1}"` notation, but instead directly refer to the script `script1`
- If your AI request seem to 'know' more information that you provide them, it could be because these request automatically receive the latest sound, image, and message as input, which will only affect the result if you provide no other input (and if the function can accept this type of input e.g. soundToText does not accept images as input)
