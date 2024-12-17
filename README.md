# ConvoScript_Library

Add Human-AI conversation easily to you web page!

# How to use

This library allows users to specify a Human-AI conversation in a simple format, that will be turned dynamically placed on the page. Multiple scripts can be created that can refer to other scripts or themselves.

First, we create a script manager:

`const manager = new cs.ArrayManager()`

Then, we add a script:

```
const script1 = manager.addArray('script1', [
    {
        role: 'Assistant',
        content: 'Hi, how are you today?'
    },
    {
        role: 'User',
        content: 'I am fine, thanks.'
    }
])
```

Such a script contains messages that have (at least) a role and content. On the screen, this will display as:

- Assistant: Hi, how are you today?
- User: I am fine, thanks.

To achieve this, we need somewhere to place the conversation, a loading indicator, an input element, and a button:

```
<div id="placeResults"></div>
<progress hidden id="load"></progress>
<input id="input" type="hidden"></input>
<button hidden id="btn"></button>
```

Then, we can start the program. Make sure you have a Data Foundry API token available.

```
cs.run({
    manager: manager, //your array manager
    array: script1, //your main script
    api_token: api_token, //your data foundry api token
    resultElementSelector: '#placeResults', //the HTML element where the conversation will be placed
    loadingElementSelector: '#load', //the HTML element that shows a loading icon when waiting for AI requests
    inputElementSelector: '#input', //the HTML input element that is used by the user to give input
    acceptButtonElementSelector: '#btn', //the HTML button that is used to send user messages
    delayTime: 500, //A delay after every message that can help distinguish incoming messages
    })
```

Different message types are available:

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
    content: {content: 'input', type 'text'}
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

You may want to use the user input as the prompt. To do that, we can reference the part of the array / script where a user has provided this input. Such as reference must be written in a specific format: `"${here}"`. The reference to the first message in `script1` would be: `"${script1[0]}"`, and the reference to the content of the second message in `script1` would be: `"${script1[1].content}"`. Make sure to use regular apostrophes `"`, and not backticks `\``.

```
const script1 = manager.addArray('script1', [
    {
        role: 'User',
        content: {content: 'input', type 'text'}
    },
    {
        role: 'function',
        content: 'textToText',
        messages: '${script1[0]}'
    }
])
```

It is possible to have multiple scripts, and switch to one of those depending on e.g. the user input. For that we can write a condition. If it is true, the program will run script2, otherwise it will run script3:

```
const script1 = manager.addArray('script1', [
    {
        role: 'User',
        content: {content: 'input', type 'text'}
    },
    {
        role: 'condition',
        content: '${script1[0].content.includes("yes")}',
        true: 'script2',
        false: 'script3'
    }
])
```

If you want to use a certain part of the conversation for a different purpose on you page, you can specify what part to return:

const script1 = manager.addArray('script1', [
{
role: 'User',
content: {content: 'input', type 'text'}
},
{
role: 'return',
content: '${script1[0]}'
}
])

```

```
