# Obsidian Shortcut Launcher

![](https://cdn.macstories.net/cleanshot-2022-01-21-at-5-39-50-2x-1642783463880.png)

Trigger shortcuts in Apple's Shortcuts app as custom commands from Obsidian. 

Obsidian Shortcut Launcher (abbreviated as 'OSL') lets you trigger shortcuts and pass along values from Obsidian as input. On iOS, iPadOS, and macOS, shortcuts are triggered from Obsidian using Apple's official URL scheme for Shortcuts.

The plugin requires iOS 15, iPadOS 15, or macOS Monterey.

## Installing Obsidian Shortcut Launcher 

You can find the plugin in Obsidian's Community Plugins section. Just search for 'Obsidian Shortcut Launcher', install it, then enable the plugin to start using it in Obsidian.

## Creating Launchers for Shortcuts

![Creating launchers for Shortcuts in Obsidian.](https://cdn.macstories.net/monday-24-jan-2022-18-21-39-1643044904822.png)

OSL works by creating "launchers" for shortcuts you want to run in the Shortcuts app. These launchers show up as individual commands in Obsidian.

You can create a new launcher for Shortcuts in OSL's settings by tapping the 'New' button. When creating a new launcher, there are three main fields you have to configure:

* **Command Name**: The name of the launcher. This will appear as a command in Obsidian. This name can be anything you want and does not need to match the name of the shortcut.
* **Shortcut Name**: The exact name of the shortcut you want to launch in Shortcuts app.
* **Input Type**: The input you want to pass from Obsidian to the Shortcuts app. See next section for more details.

## Passing Values from Obsidian

![](https://cdn.macstories.net/cleanshot-2022-01-21-at-5-47-57-2x-1642783800591.png)

Obsidian Shortcut Launcher lets you run shortcuts with input text passed by Obsidian. There are seven different input types you can pass from Obsidian to Shortcuts:

* **Selected Text**: The current text selection from the editor.
* **Selected Link/Embed Contents**: The contents of the file referenced in an [[internal link]] under the cursor. If the internal link points to a note, the full text of the note will be passed to Shortcuts as input; if the internal link points to an attachment (e.g. an image), the file will be encoded with base64 first and passed to Shortcuts as base64-encoded text.
* **Current Paragraph**: The text of the paragraph the cursor is currently in.
* **Entire Document**: The entire text of the current document.
* **Link to Document**: The Obsidian URL to the current document.
* **Document Name**: The name of the current document, without file extension.
* **Document Path**: The relative path to the current document in your Obsidian vault.

Here is an example of an Obsidian command that has passed the name of the current document to a shortcut in the Shortcuts app:

![](https://cdn.macstories.net/monday-24-jan-2022-18-23-05-1643044990698.png)

And here is how you can receive attachments from Obsidian and decode them using base64 in Shortcuts:

---SEND ATTACHMENT HERE

## Passing Multiple Values with Custom Separators

OSL also features a 'Multiple' option that lets you pass *multiple* values at once to a shortcut. When you select this option, you can choose multiple input types, which will be passed to Shortcuts with a separator. 

By default, the separator character is `,` (a comma), but you can change the separator to be whatever you want. To access multiple input values in Shortcuts, use the 'Split Text' action and enter a value for the Custom Separator.

---PASS MULTIPLE OPTIONS

## Running Shortcuts with Input

![](https://cdn.macstories.net/cleanshot-2022-01-21-at-5-48-32-2x-1642783800940.png)

Text passed by OSL to a shortcut is available in the default 'Shortcut Input' variable of the Shortcuts app. In the case of files passed as base64-encoded text, you will have to decode the input first using the dedicated Decode Base64 action.

Regardless of the kind of data you pass from Obsidian to Shortcuts, Obsidian will always need to launch the Shortcuts app via URL scheme to send data to it.
