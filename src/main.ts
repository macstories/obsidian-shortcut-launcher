import {
	getLinkpath,
	Notice,
	Platform,
	Plugin,
	ReferenceCache,
} from "obsidian";
import { SettingsTab } from "./SettingsTab";

declare module "obsidian" {
	interface Commands {
		removeCommand(arg0: string): void;
		commands: any[];
	}
	interface App {
		commands: Commands;
	}
}

interface Launcher {
	commandName: string;
	shortcutName: string;
	inputType: string;
}

interface ShortcutLauncherPluginSettings {
	launchers: Launcher[];
}

const DEFAULT_SETTINGS: ShortcutLauncherPluginSettings = {
	launchers: [],
};

export default class ShortcutLauncherPlugin extends Plugin {
	settings: ShortcutLauncherPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));
		await this.createCommands();
	}

	async createCommands() {
		this.settings.launchers.forEach((launcher, index) => {
			if (["Clipboard", "None"].contains(launcher.inputType)) {
				this.addCommand({
					id: `${index}`,
					name: launcher.commandName,
					callback: () => {
						if (launcher.inputType == "Clipboard") {
							window.open(
								`shortcuts://run-shortcut?name=${encodeURIComponent(
									launcher.shortcutName
								)}&input=clipboard`
							);
						} else if (launcher.inputType == "None") {
							window.open(
								`shortcuts://run-shortcut?name=${encodeURIComponent(
									launcher.shortcutName
								)}`
							);
						}
					},
				});
			} else {
				this.addCommand({
					id: `${index}`,
					name: launcher.commandName,
					editorCallback: async (editor) => {
						var text = "";
						if (launcher.inputType == "Selected Text") {
							text = editor.getSelection();
						} else if (launcher.inputType == "Current Paragraph") {
							let metadataCache =
								this.app.metadataCache.getFileCache(
									this.app.workspace.getActiveFile()
								);
							if (!metadataCache.sections) {
								return new Notice(
									"Could not find current paragraph"
								);
							}
							let cursorOffset = editor.posToOffset(
								editor.getCursor()
							);
							let matchingSection = metadataCache.sections.filter(
								(section) =>
									section.position.start.offset <=
										cursorOffset &&
									section.position.end.offset >= cursorOffset
							);
							if (matchingSection.length > 0) {
								let documentContents =
									await this.app.vault.read(
										this.app.workspace.getActiveFile()
									);
								text = documentContents.substring(
									matchingSection[0].position.start.offset,
									matchingSection[0].position.end.offset
								);
							} else {
								return new Notice(
									"Could not find current paragraph"
								);
							}
						} else if (launcher.inputType == "Entire Document") {
							text = await this.app.vault.read(
								this.app.workspace.getActiveFile()
							);
						} else if (launcher.inputType == "Link to Document") {
							text = `obsidian://open?vault=${encodeURIComponent(
								this.app.vault.getName()
							)}&file=${encodeURIComponent(
								this.app.workspace.getActiveFile().path
							)}`;
						} else if (
							launcher.inputType == "Selected Link/Embed Contents"
						) {
							let metadataCache =
								this.app.metadataCache.getFileCache(
									this.app.workspace.getActiveFile()
								);

							let linksAndEmbeds = (
								(metadataCache.links ?? []) as ReferenceCache[]
							).concat(
								(metadataCache.embeds ?? []) as ReferenceCache[]
							);
							let cursorOffset = editor.posToOffset(
								editor.getCursor()
							);
							let matchingLinkOrEmbed = linksAndEmbeds.filter(
								(cached) =>
									cached.position.start.offset <=
										cursorOffset &&
									cached.position.end.offset >= cursorOffset
							);
							if (matchingLinkOrEmbed.length > 0) {
								let linkpath = getLinkpath(
									matchingLinkOrEmbed[0].link
								);
								let linkedFile =
									this.app.metadataCache.getFirstLinkpathDest(
										linkpath,
										this.app.workspace.getActiveFile().path
									);
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
								return new Notice(
									"Could not find current link or embed"
								);
							}
						}
						if (Platform.isMobileApp) {
							window.open(
								`shortcuts://run-shortcut?name=${encodeURIComponent(
									launcher.shortcutName
								)}&input=text&text=${encodeURIComponent(text)}`
							);
						} else {
							require("child_process").exec(
								`echo "${text}" | shortcuts run "${launcher.shortcutName}"`
							);
						}
					},
				});
			}
		});
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

		Object.keys(this.app.commands.commands)
			.filter((commandName) =>
				commandName.startsWith("obsidian-shortcut-launcher")
			)
			.forEach((commandName) => {
				this.app.commands.removeCommand(commandName);
			});

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
