import { Editor, Plugin, View } from 'obsidian';

import { applyPattern } from './ApplyPattern';
import {
	Command,
	defaultCommandSettings,
	defaultPatternSettings,
	defaultPatternRuleSettings,
	defaultSettings,
	getSettings,
	Pattern,
	PatternRule,
	updateSettings,
} from './Settings';
import { SettingsTab } from './SettingsTab';

export default class ApplyPatternsPlugin extends Plugin {
	async onload() {
		console.log('loading plugin "apply-patterns"');

		await this.loadSettings();

		this.addSettingTab(new SettingsTab({ plugin: this }));

		this.addCommand({
			id: 'apply-pattern-to-lines',
			name: 'Apply pattern to whole lines',
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: View,
			) => {
				return applyPattern(checking, editor, view, this.app, 'lines');
			},
		});

		this.addCommand({
			id: 'apply-pattern-to-selection',
			name: 'Apply pattern to selection',
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: View,
			) => {
				return applyPattern(
					checking,
					editor,
					view,
					this.app,
					'selection',
				);
			},
		});

		this.addCommand({
			id: 'apply-pattern-to-document',
			name: 'Apply pattern to whole document',
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: View,
			) => {
				return applyPattern(
					checking,
					editor,
					view,
					this.app,
					'document',
				);
			},
		});

		const settingsCommands = getSettings().commands || [];
		settingsCommands.forEach((command: Command, commandIndex) => {
			if (command.patternFilter !== '') {
				for (const [type, plainLanguage] of Object.entries({
					selection: 'selection',
					lines: 'whole lines',
					document: 'whole document',
				})) {
					// Get TypeScript to understand type as a key, rather than
					// as a string. See https://stackoverflow.com/a/62438434
					// for an explanation.
					const commandTypeKey = type as keyof Command;
					if (command[commandTypeKey] === true) {
						this.addCommand({
							id: `apply-pattern-${commandIndex}-${type}`,
							name: `${
								command.name ||
								'Unnamed command ' + commandIndex
							} on ${plainLanguage}`,
							editorCheckCallback: (
								checking: boolean,
								editor: Editor,
								view: View,
							) => {
								return applyPattern(
									checking,
									editor,
									view,
									this.app,
									type,
									command,
								);
							},
						});
					}
				}
			}
		});
	}

	onunload() {
		console.log('unloading plugin "apply-patterns"');
	}

	async loadSettings() {
		let userSettings = await this.loadData();

		// Update settings if the API version has been incremented:
		if (
			userSettings === null ||
			userSettings.apiVersion === null ||
			userSettings.apiVersion < defaultSettings.apiVersion
		) {
			userSettings = { ...defaultSettings, ...userSettings };

			userSettings.patterns.forEach(
				(pattern: Pattern, patternIndex: number) => {
					pattern.rules.forEach(
						(rule: PatternRule, ruleIndex: number) => {
							pattern.rules[ruleIndex] = {
								...defaultPatternRuleSettings,
								...rule,
							};
						},
					);

					return (userSettings.patterns[patternIndex] = {
						...defaultPatternSettings,
						...pattern,
					});
				},
			);

			userSettings.commands.forEach(
				(command: Command, commandIndex: number) => {
					return (userSettings.commands[commandIndex] = {
						...defaultCommandSettings,
						...command,
					});
				},
			);
		}

		updateSettings(userSettings);
	}

	async saveSettings() {
		await this.saveData(getSettings());
	}
}
