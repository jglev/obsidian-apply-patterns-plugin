import { Editor, Plugin, View } from 'obsidian';

import { applyPattern } from './ApplyPattern';
import { getSettings, updateSettings } from './Settings';
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
