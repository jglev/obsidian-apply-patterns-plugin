import { Plugin } from 'obsidian';

import { Commands } from './Commands';
import { getSettings, updateSettings } from './Settings';
import { SettingsTab } from './SettingsTab';

export default class TasksPlugin extends Plugin {
    async onload() {
        console.log('loading plugin "apply-patterns"');

        await this.loadSettings();
        this.addSettingTab(new SettingsTab({ plugin: this }));

        new Commands({ plugin: this });
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
