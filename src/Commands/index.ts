import { applyPattern } from './ApplyPattern';
import type { App, Editor, Plugin, View } from 'obsidian';

export class Commands {
    private readonly plugin: Plugin;

    private get app(): App {
        return this.plugin.app;
    }

    constructor({ plugin }: { plugin: Plugin }) {
        this.plugin = plugin;

        plugin.addCommand({
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

        plugin.addCommand({
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
}
