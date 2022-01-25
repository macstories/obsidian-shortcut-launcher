import { App, PluginSettingTab, Setting } from "obsidian";
import { LauncherModal } from "./LauncherModal";
import ShortcutLauncherPlugin from "./main";

export class SettingsTab extends PluginSettingTab {
	plugin: ShortcutLauncherPlugin;

	constructor(app: App, plugin: ShortcutLauncherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Shortcut Launchers" });

		new Setting(containerEl).addButton((button) =>
			button
				.setButtonText("New")
				.setCta()
				.onClick(() => {
					new LauncherModal(
						this.app,
						false,
						"",
						"",
						["Selected Text"],
						",",
						(commandName, shortcutName, inputTypes, separator) => {
							this.plugin.settings.launchers.splice(0, 0, {
								commandName: commandName,
								shortcutName: shortcutName,
								inputTypes: inputTypes,
								separator: separator,
							});
							this.plugin.saveSettings();
							this.display();
						}
					).open();
				})
		);

		this.plugin.settings.launchers.forEach((launcher, index) => {
			new Setting(containerEl)
				.setName(launcher.commandName)
				.setDesc(`${launcher.shortcutName} < ${launcher.inputTypes[0]}`)
				.addButton((button) =>
					button.setIcon("pencil").onClick((event) => {
						new LauncherModal(
							this.app,
							true,
							launcher.commandName,
							launcher.shortcutName,
							launcher.inputTypes,
							launcher.separator,
							(
								commandName,
								shortcutName,
								inputTypes,
								separator
							) => {
								this.plugin.settings.launchers[
									index
								].commandName = commandName;
								this.plugin.settings.launchers[
									index
								].shortcutName = shortcutName;
								this.plugin.settings.launchers[
									index
								].inputTypes = inputTypes;
								this.plugin.settings.launchers[
									index
								].separator = separator;
								this.plugin.saveSettings();
								this.display();
							}
						).open();
					})
				)
				.addButton((button) =>
					button
						.setIcon("trash")
						.setWarning()
						.onClick(() => {
							this.plugin.settings.launchers.splice(index, 1);
							this.plugin.saveSettings();
							this.display();
						})
				);
		});
	}
}
