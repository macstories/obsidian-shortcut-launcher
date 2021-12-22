import { App, Modal, Notice, Setting } from "obsidian";

export class LauncherModal extends Modal {
	isEditing: boolean;
	commandName: string;
	shortcutName: string;
	inputType: string;

	onSave: (
		commandName: string,
		shortcutName: string,
		inputType: string
	) => void;

	constructor(
		app: App,
		isEditing: boolean,
		commandName: string,
		shortcutName: string,
		inputType: string,
		onSave: (
			commandName: string,
			shortcutName: string,
			inputType: string
		) => void
	) {
		super(app);
		this.isEditing = isEditing;
		this.commandName = commandName;
		this.shortcutName = shortcutName;
		this.inputType = inputType;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", {
			text: this.isEditing ? "Edit Launcher" : "New Launcher",
		});

		new Setting(contentEl)
			.setName("Command Name")
			.setDesc("The Obsidian command name.")
			.addText((text) =>
				text
					.setPlaceholder("Command Name")
					.setValue(this.commandName)
					.onChange((value) => (this.commandName = value))
			);

		new Setting(contentEl)
			.setName("Shortcut Name")
			.setDesc("The name of the shortcut to launch.")
			.addText((text) =>
				text
					.setPlaceholder("Shortcut Name")
					.setValue(this.shortcutName)
					.onChange((value) => (this.shortcutName = value))
			);

		new Setting(contentEl)
			.setName("Input Type")
			.setDesc("The initial input into the shortcut.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						"Selected Text": "Selected Text",
						"Current Paragraph": "Current Paragraph",
						"Entire Document": "Entire Document",
						Clipboard: "Clipboard",
						None: "None",
					})
					.setValue(this.inputType)
					.onChange((value) => (this.inputType = value))
			);

		new Setting(contentEl).addButton((button) =>
			button
				.setButtonText("Save")
				.setCta()
				.onClick(() => {
					if (!this.commandName || this.commandName.length == 0) {
						return new Notice("Specify a command name.");
					}
					if (!this.shortcutName || this.shortcutName.length == 0) {
						return new Notice("Specify a shortcut name.");
					}
					this.onSave(
						this.commandName,
						this.shortcutName,
						this.inputType
					);
					this.close();
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
