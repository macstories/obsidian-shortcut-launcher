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
						"Selected Text",
						(commandName, shortcutName, inputType) => {
							this.plugin.settings.launchers.splice(0, 0, {
								commandName: commandName,
								shortcutName: shortcutName,
								inputType: inputType,
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
				.setDesc(
					`${launcher.shortcutName}${
						launcher.inputType == "None" ? "" : " < "
					}${launcher.inputType == "None" ? "" : launcher.inputType}`
				)
				.addButton((button) =>
					button.setIcon("pencil").onClick((event) => {
						new LauncherModal(
							this.app,
							true,
							launcher.commandName,
							launcher.shortcutName,
							launcher.inputType,
							(commandName, shortcutName, inputType) => {
								this.plugin.settings.launchers[
									index
								].commandName = commandName;
								this.plugin.settings.launchers[
									index
								].shortcutName = shortcutName;
								this.plugin.settings.launchers[
									index
								].inputType = inputType;
								this.plugin.saveSettings();
								this.display();
							}
						).open();
					})
				)
				.addButton((button) =>
					button.setIcon("trash").setWarning().onClick(() => {
						this.plugin.settings.launchers.splice(index, 1);
						this.plugin.saveSettings();
						this.display();
					})
				);
		});
	}
}
