import { App, Modal, Notice, Setting } from "obsidian";

export class LauncherModal extends Modal {
	isEditing: boolean;
	commandName: string;
	shortcutName: string;
	inputTypes: string[];
	separator: string;
	insertShortcutText: boolean;

	onSave: (
		commandName: string,
		shortcutName: string,
		inputTypes: string[],
		separator: string,
		insertShortcutText: boolean,
	) => void;

	constructor(
		app: App,
		isEditing: boolean,
		commandName: string,
		shortcutName: string,
		inputTypes: string[],
		separator: string,
		insertShortcutText: boolean,
		onSave: (
			commandName: string,
			shortcutName: string,
			inputTypes: string[],
			separator: string,
			insertShortcutText: boolean,
		) => void
	) {
		super(app);
		this.isEditing = isEditing;
		this.commandName = commandName;
		this.shortcutName = shortcutName;
		this.inputTypes = inputTypes;
		this.separator = separator;
		this.insertShortcutText = insertShortcutText;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

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
						"Selected Link/Embed Contents":
							"Selected Link/Embed Contents",
						"Current Paragraph": "Current Paragraph",
						"Entire Document": "Entire Document",
						"Link to Document": "Link to Document",
						"Document Name": "Document Name",
						"Document Path": "Document Path",
						"Backlinks to Document": "Backlinks to Document",
						"YAML Frontmatter": "YAML Frontmatter",
						Multiple: "Multiple",
					})
					.setValue(this.inputTypes[0])
					.onChange((value) => {
						if (value == "Multiple") {
							this.inputTypes = [
								"Multiple",
								"Document Name",
								"Selected Text",
							];
						} else {
							this.inputTypes = [value];
						}
						this.onOpen();
					})
			);

		if (this.inputTypes.length > 1) {
			this.inputTypes
				.filter((_, index) => index > 0)
				.forEach((inputType, index) => {
					const setting = new Setting(contentEl)
						.setName(`Input Type #${index + 1}`)
						.addDropdown((dropdown) =>
							dropdown
								.addOptions({
									"Selected Text": "Selected Text",
									"Selected Link/Embed Contents":
										"Selected Link/Embed Contents",
									"Current Paragraph": "Current Paragraph",
									"Entire Document": "Entire Document",
									"Link to Document": "Link to Document",
									"Document Name": "Document Name",
									"Document Path": "Document Path",
									"Backlinks to Document":
										"Backlinks to Document",
									"YAML Frontmatter": "YAML Frontmatter",
								})
								.setValue(inputType)
								.onChange((value) => {
									this.inputTypes[index + 1] = value;
								})
						);
					if (index > 1) {
						setting.addButton((button) =>
							button
								.setIcon("trash")
								.setWarning()
								.onClick(() => {
									this.inputTypes.splice(index + 1, 1);
									this.onOpen();
								})
						);
					}
				});

			new Setting(contentEl).addButton((button) =>
				button.setButtonText("Add Input").onClick(() => {
					this.inputTypes.push("Selected Text");
					this.onOpen();
				})
			);

			new Setting(contentEl)
				.setName("Separator")
				.setDesc("The separator to insert between input types.")
				.addText((text) =>
					text
						.setValue(this.separator)
						.onChange((value) => (this.separator = value))
				);
		}

		new Setting(contentEl)
			.setName("Insert shortcut text")
			.setDesc("Insert the response from the shortcut after the cursor or selected text.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.insertShortcutText)
					.onChange((value) => {
						(this.insertShortcutText = value)
					})
			);

		new Setting(contentEl)
			.addButton((button) =>
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
							this.inputTypes,
							this.separator,
							this.insertShortcutText
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
