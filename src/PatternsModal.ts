import { App, FuzzySuggestModal } from 'obsidian';
import { Pattern, PatternRule, getSettings } from 'Settings';

export class PatternModal extends FuzzySuggestModal<number> {
    public readonly onChooseItem: (patternIndex: number) => void;

    constructor({
        app,
        onChooseItem,
    }: {
        app: App;
        onChooseItem: (patternIndex: number) => void;
    }) {
        super(app);

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
        const patterns = getSettings()
            .patterns.filter(
                (pattern: Pattern) =>
                    pattern.rules.length > 0 &&
                    pattern.rules.every(
                        (rule: PatternRule) => rule.from !== '',
                    ),
            )
            .map((_: Pattern, patternIndex: number) => {
                return patternIndex;
            });
        return patterns;
    }

    getItemText(patternIndex: number): string {
        const patternName =
            getSettings().patterns[patternIndex].name ||
            `(Untitled Pattern ${patternIndex})`;
        return patternName;
    }
}
