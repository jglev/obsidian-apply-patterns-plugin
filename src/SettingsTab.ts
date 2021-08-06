import cloneDeep from 'lodash.clonedeep';
import { Notice, PluginSettingTab, Setting } from 'obsidian';
import { validateRuleString } from 'ValidateRuleString';
import { Pattern, PatternRule, getSettings, updateSettings } from './Settings';
import type ApplyPatterns from './main';

const moveInArray = (arr: any[], from: number, to: number) => {
    const arrClone = cloneDeep(arr);
    const item = arrClone[from];
    arrClone.splice(from, 1);
    arrClone.splice(to, 0, item);
    return arrClone;
};

export class SettingsTab extends PluginSettingTab {
    private readonly plugin: ApplyPatterns;

    constructor({ plugin }: { plugin: ApplyPatterns }) {
        super(plugin.app, plugin);

        this.plugin = plugin;
    }

    public display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Apply Patterns' });

        const patternsEl = containerEl.createEl('div');
        patternsEl.addClass('patterns');
        const patternsDescEl = patternsEl.createEl('div', {
            cls: 'patterns-description-el',
        });
        const fragment = document.createDocumentFragment();

        patternsDescEl.createEl('p').append(
            'This plugin allows setting "patterns" for editing text by applying sequences of "rules." Each "rule" is a find-and-replace operation, using Regular Expressions. If you are unfamiliar with Regular Expressions, you can learn more about them at ',
            fragment.createEl('a', {
                href: 'https://regex101.com/',
                text: 'Regex101',
            }),
            ', ',
            fragment.createEl('a', {
                href: 'https://www.regular-expressions.info/',
                text: 'Regular Expressions.info',
            }),
            ', and elsewhere.',
        );

        patternsDescEl.createEl(
            'h4',
            'Tips for the "From" and "To" fields for each rule:',
        );

        const patternsDescToTipsEl = patternsDescEl.createEl('ul');

        patternsDescToTipsEl.createEl('li').append(
            fragment.createEl('a', {
                href: 'https://www.regular-expressions.info/brackets.html',
                text: 'Capture groups',
            }),
            ' can be referenced using "$1", "$2", etc.',
        );
        patternsDescToTipsEl.createEl('li').append(
            'To ',
            fragment.createEl('a', {
                href: 'https://www.regular-expressions.info/characters.html',
                text: 'escape',
            }),
            ' special characters, only one backslash is needed.',
        );

        patternsDescToTipsEl.createEl('li').append(
            'Both the "From" and "To" fields for each rule ',
            fragment.createEl('span', {
                text: 'will understand natural-language dates',
                cls: 'bold',
            }),
            ' presented in the following format: ',
            fragment.createEl('code', {
                text: '{{date:start|end|format|separator}}',
            }),
            ', where ',
            fragment.createEl('code', { text: 'start' }),
            ' and ',
            fragment.createEl('code', { text: 'end' }),
            ' are both ',
            fragment.createEl('a', {
                href: 'https://github.com/wanasit/chrono',
                text: 'English-language dates',
            }),
            ', and ',
            fragment.createEl('code', { text: 'format' }),
            ' is a format from ',
            fragment.createEl('a', {
                href: 'https://day.js.org/docs/en/parse/string-format#list-of-all-available-parsing-tokens',
                text: 'DayJS',
            }),
            ', and ',
            fragment.createEl('code', { text: 'separator' }),
            ' is the string that will separate lists of dates if ',
            fragment.createEl('code', { text: 'start' }),
            ' and ',
            fragment.createEl('code', { text: 'end' }),
            ' are both set and are set to different days. All fields are optional. Using just ',
            fragment.createEl('code', { text: '{{date}}' }),
            ' (or ',
            fragment.createEl('code', { text: '{{date||YYYY-MM-DD}}' }),
            "), will evaluate to today's date in YYYY-MM-DD format.",
        );

        patternsEl.createEl('h3', { text: 'Patterns' });
        patternsEl.createEl('div', {
            text: 'Combinations of find-and-replace "rules" that can be applied to highlighted lines of text.',
            cls: 'setting-item-description',
        });

        new Setting(patternsEl)
            .addText((text) => {
                const settings = getSettings();
                text.setValue(settings.filterString || '').onChange(
                    async (value) => {
                        updateSettings({
                            ...cloneDeep(getSettings()),
                            filterString: value,
                        });

                        await this.plugin.saveSettings();
                    },
                );
            })
            .addButton((button) => {
                button
                    .setIcon('magnifying-glass')
                    .setTooltip('Filter Patterns')
                    .onClick(async () => {
                        this.display();
                    });
            })
            .setDesc('Filter patterns by name');

        const patterns = getSettings().patterns;
        for (const [patternIndex, pattern] of patterns.entries()) {
            const settings = getSettings();
            const patternFilterString = settings.filterString;
            if (
                patternFilterString !== undefined &&
                patternFilterString !== ''
            ) {
                if (
                    !pattern.name
                        .toLowerCase()
                        .includes(patternFilterString.toLowerCase())
                ) {
                    continue;
                }
            }

            const patternEl = patternsEl.createEl('div');
            patternEl.addClass('pattern');

            const patternName = patternEl.createEl('div', {
                cls: 'pattern-name',
            });

            new Setting(patternName)
                // .setDesc('Pattern name')
                .addText((text) => {
                    text.setPlaceholder('Pattern name')
                        .setValue(pattern.name)
                        .onChange(async (value) => {
                            const newPatterns = cloneDeep(
                                getSettings().patterns,
                            );
                            newPatterns.splice(patternIndex, 1, {
                                ...patterns[patternIndex],
                                name: value,
                            });
                            updateSettings({
                                patterns: newPatterns,
                            });

                            await this.plugin.saveSettings();
                        });
                })
                .addExtraButton((button) => {
                    button
                        .setIcon('moveRowUp')
                        .setTooltip('Move Pattern up')
                        .setDisabled(patternIndex === 0)
                        .onClick(async () => {
                            let newPatterns = cloneDeep(getSettings().patterns);
                            newPatterns = moveInArray(
                                newPatterns,
                                patternIndex,
                                patternIndex - 1,
                            );
                            updateSettings({
                                patterns: newPatterns,
                            });

                            await this.plugin.saveSettings();
                            this.display();
                        });
                })
                .addExtraButton((button) => {
                    button
                        .setIcon('moveRowDown')
                        .setTooltip('Move Rule down')
                        .setDisabled(patternIndex === patterns.length - 1)
                        .onClick(async () => {
                            let newPatterns = cloneDeep(getSettings().patterns);
                            newPatterns = moveInArray(
                                newPatterns,
                                patternIndex,
                                patternIndex + 1,
                            );
                            updateSettings({
                                patterns: newPatterns,
                            });

                            await this.plugin.saveSettings();
                            this.display();
                        });
                })
                .addExtraButton((button) => {
                    button
                        .setIcon('cross')
                        .setTooltip('Delete pattern')
                        .onClick(async () => {
                            const newPatterns = cloneDeep(
                                getSettings().patterns,
                            );
                            newPatterns.splice(patternIndex, 1);
                            updateSettings({
                                patterns: newPatterns,
                            });

                            await this.plugin.saveSettings();
                            this.display();
                        });
                });

            const rulesEl = patternEl.createEl('div');
            rulesEl.addClass('rules');

            pattern.rules.forEach((rule: PatternRule, ruleIndex) => {
                const ruleEl = rulesEl.createEl('div');
                ruleEl.addClass('rule');
                if (rule.disabled === true) {
                    ruleEl.addClass('disabled');
                }

                new Setting(ruleEl)
                    .setDesc(`Rule ${ruleIndex + 1}`)
                    .addButton((button) => {
                        button
                            .setIcon(
                                rule.disabled === true ? 'broken-link' : 'link',
                            )
                            .setTooltip(
                                rule.disabled === true ? 'Enable' : 'Disable',
                            )
                            .onClick(async () => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules[
                                    ruleIndex
                                ].disabled =
                                    newPatterns[patternIndex].rules[ruleIndex]
                                        .disabled === true
                                        ? false
                                        : true;
                                updateSettings({
                                    patterns: newPatterns,
                                });
                                await this.plugin.saveSettings();
                                this.display();
                            });
                    })
                    .addTextArea((text) => {
                        text.setPlaceholder('From (Regex)')
                            .setValue(rule.from)
                            .onChange(async (value) => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules.splice(
                                    ruleIndex,
                                    1,
                                    {
                                        ...newPatterns[patternIndex].rules[
                                            ruleIndex
                                        ],
                                        from: value || '',
                                    },
                                );
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                            });
                    })
                    .addToggle((toggle) => {
                        toggle
                            .setTooltip('Case-insensitive')
                            .setValue(rule.caseInsensitive)
                            .onChange(async (value) => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules[
                                    ruleIndex
                                ].caseInsensitive = value;
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                            });
                    })
                    .addToggle((toggle) => {
                        toggle
                            .setTooltip('Global')
                            .setValue(rule.global)
                            .onChange(async (value) => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules[
                                    ruleIndex
                                ].global = value;
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                            });
                    })
                    .addToggle((toggle) => {
                        toggle
                            .setTooltip('Multiline')
                            .setValue(rule.multiline)
                            .onChange(async (value) => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules[
                                    ruleIndex
                                ].multiline = value;
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                            });
                    })
                    .addToggle((toggle) => {
                        toggle
                            .setTooltip('Sticky')
                            .setValue(rule.sticky)
                            .onChange(async (value) => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules[
                                    ruleIndex
                                ].sticky = value;
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                            });
                    })
                    .addTextArea((text) => {
                        text.setPlaceholder('To')
                            .setValue(rule.to)
                            .onChange(async (value) => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules.splice(
                                    ruleIndex,
                                    1,
                                    {
                                        ...newPatterns[patternIndex].rules[
                                            ruleIndex
                                        ],
                                        to: value || '',
                                    },
                                );
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                            });
                    })
                    .addExtraButton((button) => {
                        button
                            .setIcon('info')
                            .setTooltip('View compiled From ⇨ To')
                            .onClick(async () => {
                                const updatedRule =
                                    getSettings().patterns[patternIndex].rules[
                                        ruleIndex
                                    ];

                                const fromValidated = validateRuleString(
                                    updatedRule.from,
                                );
                                const toValidated = validateRuleString(
                                    updatedRule.to,
                                    false,
                                );
                                const noticeTimeoutSeconds = 1000 * 30; // 30 seconds
                                if (!fromValidated.valid) {
                                    new Notice(
                                        `"From" pattern is invalid: ${fromValidated.string}`,
                                        noticeTimeoutSeconds,
                                    );
                                    return;
                                }

                                if (toValidated.valid === false) {
                                    new Notice(
                                        `"To" pattern is invalid: ${toValidated.string}`,
                                        noticeTimeoutSeconds,
                                    );
                                    return;
                                }

                                new Notice(
                                    new RegExp(
                                        fromValidated.string,
                                        ('u' + updatedRule.caseInsensitive
                                            ? 'i'
                                            : '') +
                                            (updatedRule.global ? 'g' : '') +
                                            (updatedRule.multiline ? 'm' : '') +
                                            (updatedRule.sticky ? 's' : ''),
                                    ).toString() +
                                        '\n⇩\n' +
                                        (toValidated.string !== ''
                                            ? '"' + toValidated.string + '"'
                                            : '[Remove]'),
                                    noticeTimeoutSeconds,
                                );
                            });
                    })
                    .addExtraButton((button) => {
                        button
                            .setIcon('moveRowUp')
                            .setTooltip('Move Rule up')
                            .setDisabled(ruleIndex === 0)
                            .onClick(async () => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules = moveInArray(
                                    newPatterns[patternIndex].rules,
                                    ruleIndex,
                                    ruleIndex - 1,
                                );
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                                this.display();
                            });
                    })
                    .addExtraButton((button) => {
                        button
                            .setIcon('moveRowDown')
                            .setTooltip('Move Rule down')
                            .setDisabled(ruleIndex === pattern.rules.length - 1)
                            .onClick(async () => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules = moveInArray(
                                    newPatterns[patternIndex].rules,
                                    ruleIndex,
                                    ruleIndex + 1,
                                );
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                                this.display();
                            });
                    })
                    .addExtraButton((button) => {
                        button
                            .setIcon('cross-in-box')
                            .setTooltip('Delete rule')
                            .onClick(async () => {
                                const newPatterns = cloneDeep(
                                    getSettings().patterns,
                                );
                                newPatterns[patternIndex].rules.splice(
                                    ruleIndex,
                                    1,
                                );
                                updateSettings({
                                    patterns: newPatterns,
                                });

                                await this.plugin.saveSettings();
                                this.display();
                            });
                    });
            });

            const addRuleButtonEl = patternsEl.createDiv('add-rule-button');

            new Setting(addRuleButtonEl).addButton((button) => {
                button
                    .setButtonText('Add find/replace rule')
                    .setClass('add-rule-button')
                    .onClick(async () => {
                        const newPatterns = cloneDeep(getSettings().patterns);
                        newPatterns[patternIndex].rules.push({
                            from: '',
                            to: '',
                            caseInsensitive: false,
                            global: false,
                            multiline: false,
                            sticky: false,
                        });
                        updateSettings({
                            patterns: newPatterns,
                        });
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });
        }

        const addPatternButtonEl = patternsEl.createEl('div', {
            cls: 'add-pattern-button-el',
        });

        new Setting(addPatternButtonEl).addButton((button) => {
            button
                .setButtonText('Add pattern')
                .setClass('add-pattern-button')
                .onClick(async () => {
                    updateSettings({
                        patterns: [
                            ...getSettings().patterns,
                            { name: '', done: false, rules: [] },
                        ],
                    });
                    await this.plugin.saveSettings();
                    this.display();
                });
        });

        const importExportEl = containerEl.createDiv('Import / Export');
        importExportEl.addClass('import-export-div');
        importExportEl.createEl('h3', { text: 'Import / Export patterns' });
        new Setting(importExportEl)
            .setDesc(
                'You can import and export patterns as JSON through the clipboard, in order to more readily share patterns with other users.',
            )
            .addButton((button) => {
                button
                    // .setIcon('right-arrow-with-tail')
                    .setButtonText('Import from clipboard')
                    .setClass('import-pattern-button')
                    .onClick(async () => {
                        try {
                            const newSettings: Pattern[] = JSON.parse(
                                await navigator.clipboard.readText(),
                            );
                            updateSettings({
                                patterns: [
                                    ...getSettings().patterns,
                                    ...newSettings,
                                ],
                            });
                            await this.plugin.saveSettings();
                            this.display();
                            new Notice(
                                'Imported pattern settings from clipboard!',
                            );
                        } catch (error) {
                            new Notice(
                                'Error importing pattern settings from clipboard. See developer console for more information.',
                            );
                            console.log(error);
                        }
                    });
            })
            .addButton((button) => {
                button
                    // .setIcon('right-arrow-with-tail')
                    .setButtonText('Export to clipboard')
                    .setClass('export-pattern-button')
                    .onClick(async () => {
                        try {
                            const settings = getSettings().patterns;
                            await navigator.clipboard.writeText(
                                JSON.stringify(settings, null, 2),
                            );
                            new Notice(
                                'Copied pattern settings as JSON to clipboard!',
                            );
                        } catch (error) {
                            new Notice(
                                'Error copying pattern settings as JSON to clipboard. See developer console for more information.',
                            );
                            console.log(error);
                        }
                    });
            });
    }
}
