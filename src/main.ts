import { match, throws } from "assert";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { LauncherModal } from "./LauncherModal";
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
	launchers: [
		{
			commandName: "Command Test",
			shortcutName: "My Shortcut",
			inputType: "Selected Text",
		},
	],
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
			if (['Clipboard', 'None'].contains(launcher.inputType)) {
				this.addCommand({
					id: `${index}`,
					name: launcher.commandName,
					callback: () => {
						if (launcher.inputType == 'Clipboard') {
							window.open(`shortcuts://run-shortcut?name=${encodeURIComponent(launcher.shortcutName)}&input=clipboard`)
						} else if (launcher.inputType == 'None') {
							window.open(`shortcuts://run-shortcut?name=${encodeURIComponent(launcher.shortcutName)}`)
						}
					}
				});
			} else {
				this.addCommand({
					id: `${index}`,
					name: launcher.commandName,
					editorCallback: async (editor) => {
						var text = ''
						if (launcher.inputType == 'Selected Text') {
							text = editor.getSelection()
						} else if (launcher.inputType == 'Current Paragraph') {
							let metadataCache = this.app.metadataCache.getFileCache(this.app.workspace.getActiveFile())
							if (!metadataCache.sections) {
								return new Notice('Could not find current paragraph')
							}
							let cursorOffset = editor.posToOffset(editor.getCursor())
							let matchingSection = metadataCache.sections.filter(section => (section.position.start.offset <= cursorOffset && section.position.end.offset >= cursorOffset))
							if (matchingSection.length > 0) {
								let documentContents = await this.app.vault.read(this.app.workspace.getActiveFile())
								text = documentContents.substring(matchingSection[0].position.start.offset, matchingSection[0].position.end.offset)
							} else {
								return new Notice('Could not find current paragraph')
							}
						} else if (launcher.inputType == 'Entire Document') {
							text = await this.app.vault.read(this.app.workspace.getActiveFile())
						}
						window.open(`shortcuts://run-shortcut?name=${encodeURIComponent(launcher.shortcutName)}&input=text&text=${encodeURIComponent(text)}`)
					}
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
