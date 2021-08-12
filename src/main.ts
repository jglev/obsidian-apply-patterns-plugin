import { Editor, Plugin, View } from 'obsidian';

import { applyPattern } from './ApplyPattern';
import { Command, getSettings, updateSettings } from './Settings';
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
        const newSettings = await this.loadData();
        updateSettings(newSettings);
    }

    async saveSettings() {
        await this.saveData(getSettings());
    }
}
