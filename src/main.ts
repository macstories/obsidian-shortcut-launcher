import * as obsidian from 'obsidian';
import {
	Command,
	getLinkpath,
	MarkdownView,
	Notice,
	Platform,
	Plugin,
	ReferenceCache,
} from "obsidian";
import { SettingsTab } from "./SettingsTab";

const pluginCallbackPath = 'obsidian-shortcut-launcher';

declare module "obsidian" {
	interface Commands {
		removeCommand(arg0: string): void;
	}
	interface App {
		commands: Commands;
	}
	interface View {
		getSelection(): string;
	}
}

interface Launcher {
	commandName: string;
	shortcutName: string;
	inputTypes: string[];
	separator: string;
}

interface ShortcutLauncherPluginSettings {
	launchers: Launcher[];
}

const DEFAULT_SETTINGS: ShortcutLauncherPluginSettings = {
	launchers: [],
};

export default class ShortcutLauncherPlugin extends Plugin {
	settings: ShortcutLauncherPluginSettings;
	registeredCommands: Command[] = [];
	private lastLauncher;
	private statusBarIcon;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));
		await this.createCommands();
		this.registerCallbacks()
	}

	registerCallbacks() {
		// Register the callback handlers
        this.registerObsidianProtocolHandler(`${pluginCallbackPath}/success`, async (params) => {
            // Handle the success response from the iOS Shortcut
            // console.log(`Shortcut success:`, params);
            this.handleShortcutResponse(params.result, this.lastLauncher)
            this.lastLauncher = undefined;
            this.hideStatusBarIcon()
        });

        this.registerObsidianProtocolHandler(`${pluginCallbackPath}/error`, async (params) => {
            // Handle the error response from the iOS Shortcut
            console.error(`Shortcut error:`, params);
            this.lastLauncher = undefined;
            this.hideStatusBarIcon()
            new Notice(
				`There was an error running your shortcut`
			);
        });
	}

	async createCommands() {
		this.registeredCommands = [];
		this.settings.launchers.forEach((launcher) => {
			this.registeredCommands.push(
				this.addCommand({
					id: launcher.commandName.replace(/\s+/g, "-").toLowerCase(),
					name: launcher.commandName,
					checkCallback: (checking) => {
						if (checking) {
							return this.check(launcher);
						}
						var inputs: string[] = [];

						launcher.inputTypes
							.filter((inputType) => inputType != "Multiple")
							.reduce(async (promise, inputType) => {
								await promise;
								var text = "";
								if (inputType == "Selected Text") {
									text =
										this.app.workspace.activeEditor?.editor?.getSelection() ||
										"";
								} else if (inputType == "Selected Link/Embed Contents") {
									let metadataCache =
										this.app.metadataCache.getFileCache(
											this.app.workspace.getActiveFile()!
										);

									let linksAndEmbeds = (
										(metadataCache?.links ??
											[]) as ReferenceCache[]
									).concat(
										(metadataCache?.embeds ??
											[]) as ReferenceCache[]
									);
									let mdView =
										this.app.workspace.getActiveViewOfType(
											MarkdownView
										)!;
									let cursorOffset =
										mdView.editor.posToOffset(
											mdView.editor.getCursor()
										);
									let matchingLinkOrEmbed =
										linksAndEmbeds.filter(
											(cached) =>
												cached.position.start.offset <=
													cursorOffset &&
												cached.position.end.offset >=
													cursorOffset
										);
									if (matchingLinkOrEmbed.length > 0) {
										let linkpath = getLinkpath(
											matchingLinkOrEmbed[0].link
										);
										let linkedFile =
											this.app.metadataCache.getFirstLinkpathDest(
												linkpath,
												this.app.workspace.getActiveFile()!
													.path
											)!;
										if (
											!matchingLinkOrEmbed[0].link.contains(
												"."
											) ||
											linkpath.endsWith(".md") ||
											linkpath.endsWith("txt")
										) {
											text = await this.app.vault.read(
												linkedFile
											);
										} else {
											let binary =
												await this.app.vault.readBinary(
													linkedFile
												);
											text = arrayBufferToBase64(binary);
										}
									} else {
										new Notice(
											"Could not find current link or embed"
										);
									}
								} else if (inputType == "Current Paragraph") {
									let metadataCache =
										this.app.metadataCache.getFileCache(
											this.app.workspace.getActiveFile()!
										);
									if (!metadataCache?.sections) {
										new Notice(
											"Could not find current paragraph"
										);
									}
									let mdView =
										this.app.workspace.getActiveViewOfType(
											MarkdownView
										)!;
									let cursorOffset =
										mdView.editor.posToOffset(
											mdView.editor.getCursor()
										);
									let matchingSection =
										metadataCache?.sections?.filter(
											(section) =>
												section.position.start.offset <=
													cursorOffset &&
												section.position.end.offset >=
													cursorOffset
										);
									if ((matchingSection?.length || 0) > 0) {
										let documentContents =
											await this.app.vault.read(
												this.app.workspace.getActiveFile()!
											);
										text = documentContents.substring(
											matchingSection![0].position.start
												.offset,
											matchingSection![0].position.end
												.offset
										);
									} else {
										new Notice(
											"Could not find current paragraph"
										);
									}
								} else if (inputType == "Entire Document") {
									text = await this.app.vault.read(
										this.app.workspace.getActiveFile()!
									);
								} else if (inputType == "Link to Document") {
									text = `obsidian://open?vault=${encodeURIComponent(
										this.app.vault.getName()
									)}&file=${encodeURIComponent(
										this.app.workspace.getActiveFile()!.path
									)}`;
								} else if (inputType == "Document Name") {
									text =
										this.app.workspace.getActiveFile()!
											.basename;
								} else if (inputType == "Document Path") {
									text =
										this.app.workspace.getActiveFile()!
											.path;
								} else if (
									inputType == "Backlinks to Document"
								) {
									const filesLinkingToActiveFile =
										Object.entries(
											this.app.metadataCache.resolvedLinks
										)
											.filter((file) =>
												Object.keys(file[1]).contains(
													this.app.workspace.getActiveFile()!
														.path
												)
											)
											.map((file) => file[0]);
									text = filesLinkingToActiveFile.join("\n");
								} else if (inputType == "YAML Frontmatter") {
									let metadataCache =
										this.app.metadataCache.getFileCache(
											this.app.workspace.getActiveFile()!
										);
									let frontMatter =
										metadataCache?.frontmatter ?? {};
									text = JSON.stringify(frontMatter);
								}
								inputs.push(text);
							}, Promise.resolve())
							.then(() => {
								this.showStatusBarIcon(launcher)
								if (Platform.isMobileApp) {
								    // Define the base URL for the Actions URI plugin
							        const actionsUriBase = 'obsidian://';

							        // Construct the x-success and x-error URLs
							        const xSuccessURL = launcher.insertShortcutText ? `${actionsUriBase}obsidian-shortcut-launcher/success` : '';
							        const xErrorURL = `${actionsUriBase}${pluginCallbackPath}/error`;

							        // Encode the URLs for inclusion in the Shortcut URL
							        const encodedXSuccessURL = encodeURIComponent(xSuccessURL);
							        const encodedXErrorURL = encodeURIComponent(xErrorURL);

							        // Construct the URL to call the iOS Shortcut
							        const url = `shortcuts://run-shortcut?name=${encodeURIComponent(
							            launcher.shortcutName
							        )}&input=text&text=${encodeURIComponent(
							            inputs.join(launcher.separator)
							        )}&x-success=${encodedXSuccessURL}&x-error=${encodedXErrorURL}`;
							        this.lastLauncher = launcher;
							        // Open the Shortcut URL
							        window.open(url);
								} else {
									let escapedShortcutName =
										launcher.shortcutName.replace(
											/["\\]/g,
											"\\$&"
										);
									const child = require("child_process").exec(
							            `echo "${inputs.join(launcher.separator).replace(/"/g, '\\"')}" | shortcuts run "${escapedShortcutName}"`,
							            (error, stdout, stderr) => {
							                if (error) {
							                    console.error(`exec error: ${error}`);
							                    new Notice(
													`There was an error running your shortcut`
												);
							                    return;
							                }
							                if (stderr) {
							                    console.error(`stderr: ${stderr}`);
							                    new Notice(
													`There was an error running your shortcut`
												);
							                    return;
							                }
							                this.hideStatusBarIcon()
							                this.handleShortcutResponse(stdout, launcher);
							            }
							        );
								}
							});
						return true;
					},
				})
			);
		});
	}

	handleShortcutResponse(output, launcher) {
	    // Check if the setting to insert text is enabled
	    console.log(`shortcut responded with ${output}`);

	    if (!launcher.insertShortcutText) {
	        // If the setting is not enabled, simply log and return without inserting
	        console.log('Inserting text from shortcut is disabled.');
	        return;
	    }

	    // Get the active leaf (pane) in Obsidian
	    const activeLeaf = app.workspace.activeLeaf;

	    // Check if the active leaf has an editor instance
	    if (activeLeaf && activeLeaf.view instanceof obsidian.MarkdownView) {
	        const editor = activeLeaf.view.editor;
	        const doc = editor.getDoc();

	        // Prepare the text to be inserted, including the launcher's command name
	        const textToInsert = `\n**${launcher.commandName}**: ${output}\n`;

	        // Get the current cursor position
	        const cursorPos = doc.getCursor();

	        // Insert the text right after the current cursor position
	        doc.replaceRange(textToInsert, cursorPos);

	        // Move the cursor to the end of the inserted text
	        // Since we've inserted text, calculate the new cursor position
	        const linesInserted = textToInsert.split('\n').length - 1;
	        const newCursorPos = {
	            line: cursorPos.line + linesInserted,
	            ch: linesInserted > 0 ? 0 : cursorPos.ch + textToInsert.length
	        };
	        doc.setCursor(newCursorPos);
	    }
	}

	showStatusBarIcon(launcher) {
	    // Get the status bar element
	    this.statusBarIcon = this.addStatusBarItem()
	    this.statusBarIcon.setText(`Running Shortcut: ${launcher.commandName}...`)
	    // app.workspace.statusBarEl.createEl('div', { text: `Running Shortcut: ${launcher.commandName}...` });
	}

	hideStatusBarIcon() {
	    // Remove the status bar item if it exists
	    if (this.statusBarIcon) {
	        this.statusBarIcon.remove();
	        this.statusBarIcon = null;
	    }
	}

	check(launcher: Launcher): boolean {
		if (launcher.inputTypes.contains("Selected Text")) {
			return (
				(this.app.workspace.activeEditor?.editor?.getSelection()
					.length || 0) > 0
			);
		}
		if (launcher.inputTypes.contains("Selected Link/Embed Contents")) {
			let mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!mdView || mdView.getMode() !== "source") {
				return false;
			}
			let activeFile = this.app.workspace.getActiveFile();
			if (!activeFile) {
				return false;
			}
			let metadataCache = this.app.metadataCache.getFileCache(activeFile);
			if (!metadataCache) {
				return false;
			}

			let linksAndEmbeds = (
				(metadataCache.links ?? []) as ReferenceCache[]
			).concat((metadataCache.embeds ?? []) as ReferenceCache[]);
			if (typeof mdView.editor == "undefined") {
				return false;
			}
			let cursorOffset = mdView.editor.posToOffset(
				mdView.editor.getCursor()
			);
			let matchingLinkOrEmbed = linksAndEmbeds.filter(
				(cached) =>
					cached.position.start.offset <= cursorOffset &&
					cached.position.end.offset >= cursorOffset
			);
			if (matchingLinkOrEmbed.length == 0) {
				return false;
			}
		}
		if (launcher.inputTypes.contains("Current Paragraph")) {
			let mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!mdView || mdView.getMode() !== "source") {
				return false;
			}
		}
		if (
			launcher.inputTypes.contains("Entire Document") ||
			launcher.inputTypes.contains("Link to Document") ||
			launcher.inputTypes.contains("Document Name") ||
			launcher.inputTypes.contains("Document Path") ||
			launcher.inputTypes.contains("YAML Frontmatter")
		) {
			if (!this.app.workspace.getActiveFile()) {
				return false;
			}
		}
		return true;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);

		this.registeredCommands.forEach((command) => {
			this.app.commands.removeCommand(command.id);
		});
		this.registeredCommands = [];

		await this.createCommands();
	}
}

// https://stackoverflow.com/a/9458996/4927033
function arrayBufferToBase64(buffer: ArrayBuffer) {
	var binary = "";
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}
