import { App, FuzzySuggestModal } from 'obsidian';
import { filterPatterns, formatPatternName } from './FilterPatterns';
import type { Command } from 'Settings';

export class PatternModal extends FuzzySuggestModal<number> {
    public readonly onChooseItem: (patternIndex: number) => void;
    public readonly command?: Command;

    constructor({
        app,
        onChooseItem,
        command,
    }: {
        app: App;
        onChooseItem: (patternIndex: number) => void;
        command?: Command;
    }) {
        super(app);
        this.command = command;
        if (this.command !== undefined) {
            this.setInstructions([
                {
                    command:
                        command?.name ||
                        `Unnamed Apply Patterns Command (${command?.patternFilter})`,
                    purpose: '',
                },
            ]);
        }

        this.onChooseItem = (patternIndex: number) => {
            onChooseItem(patternIndex);
            // Note: Using this.close() here was causing a bug whereby new
            // text was unable to be typed until the user had opened another
            // modal or switched away from the window. @lishid noted at
            // https://github.com/obsidianmd/obsidian-releases/pull/396#issuecomment-894017526
            // that the modal is automatically closed at the conclusion of
            // onChooseItem.
        };
    }

    getItems(): number[] {
        const patternIndexes = filterPatterns(this.command);
        // If there is only one pattern, run it without offering a selection:
        if (this.command !== undefined && patternIndexes.length === 1) {
            this.close();
            this.onChooseItem(patternIndexes[0]);
        }
        return patternIndexes;
    }

    getItemText(patternIndex: number): string {
        return formatPatternName(patternIndex);
    }
}
