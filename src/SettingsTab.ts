import cloneDeep from 'lodash.clonedeep';
import { Notice, PluginSettingTab, Setting } from 'obsidian';
import { validateRuleString } from 'ValidateRuleString';
import {
    Command,
    Guards,
    Pattern,
    PatternRule,
    clearSettings,
    defaultCommandSettings,
    defaultPatternRuleSettings,
    defaultPatternSettings,
    formatUnnamedPattern,
    getSettings,
    updateSettings,
} from './Settings';
import { filterPatterns, formatPatternName } from './FilterPatterns';
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
        containerEl.createEl('h1', { text: 'Apply Patterns' });

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
            ', and elsewhere. This plugin uses the ',
            fragment.createEl('a', {
                href: 'https://www.regular-expressions.info/javascript.html',
                text: 'ECMAScript / Javascript flavor',
            }),
            ' of Regular Expressions.',
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

        patternsEl.createEl('h2', { text: 'Patterns' });
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
                            ...defaultPatternRuleSettings,
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
                            { ...defaultPatternSettings },
                        ],
                    });
                    await this.plugin.saveSettings();
                    this.display();
                });
        });

        const commandsEl = containerEl.createEl('div');
        commandsEl.addClass('commands');
        commandsEl.createEl('h2', { text: 'Commands' });
        const commandsDescriptionEl = commandsEl.createEl('div');
        commandsDescriptionEl.addClass('setting-item-description');
        commandsDescriptionEl.append(
            'Commands for the command palette. ',
            fragment.createEl('span', {
                text: 'Changes to this section are not reflected outside of this settings window until Obsidian is reloaded.',
                cls: 'bold',
            }),
            fragment.createEl('br'),
            ' Each command is populated by filtering the Pattern names above. Untitled patterns are given placeholder names of the form ',
            fragment.createEl('code', { text: formatUnnamedPattern(1) }),
            '."',
            fragment.createEl('br'),
            'If a command matches only one Pattern, it will automatically run that Pattern when the command is called. If the command matches more than one Pattern, a submenu will open, asking which Pattern you would like to run.',
        );

        new Setting(commandsEl)
            .addText((text) => {
                const settings = getSettings();
                text.setValue(settings.commandFilterString || '').onChange(
                    async (value) => {
                        updateSettings({
                            ...cloneDeep(getSettings()),
                            commandFilterString: value,
                        });

                        await this.plugin.saveSettings();
                    },
                );
            })
            .addButton((button) => {
                button
                    .setIcon('magnifying-glass')
                    .setTooltip('Filter Commands')
                    .onClick(async () => {
                        this.display();
                    });
            })
            .setDesc('Filter commands by name');

        const commands = getSettings().commands;
        for (const [commandIndex, command] of commands.entries()) {
            const settings = getSettings();
            const commandFilterString = settings.commandFilterString;
            if (
                commandFilterString !== undefined &&
                commandFilterString !== ''
            ) {
                if (
                    !command.name
                        .toLowerCase()
                        .includes(commandFilterString.toLowerCase())
                ) {
                    continue;
                }
            }

            const commandEl = commandsEl.createEl('div');
            commandEl.addClass('command');

            new Setting(commandEl)
                .setDesc(`Command ${commandIndex + 1}`)
                .addText((text) => {
                    text.setPlaceholder('Command Palette name')
                        .setValue(command.name)
                        .onChange(async (value) => {
                            const newCommands = cloneDeep(
                                getSettings().commands,
                            );
                            newCommands.splice(commandIndex, 1, {
                                ...commands[commandIndex],
                                name: value,
                            });
                            updateSettings({
                                commands: newCommands,
                            });

                            await this.plugin.saveSettings();
                        });
                })
                .addText((text) => {
                    text.setPlaceholder('Pattern name filter')
                        .setValue(command.patternFilter)
                        .onChange(async (value) => {
                            const newCommands = cloneDeep(
                                getSettings().commands,
                            );
                            newCommands.splice(commandIndex, 1, {
                                ...commands[commandIndex],
                                patternFilter: value,
                            });
                            updateSettings({
                                commands: newCommands,
                            });

                            await this.plugin.saveSettings();
                        });
                })
                .addToggle((toggle) => {
                    toggle
                        .setTooltip('Apply to Selection')
                        .setValue(command.selection || false)
                        .onChange(async (value) => {
                            const newCommands = cloneDeep(
                                getSettings().commands,
                            );
                            newCommands[commandIndex].selection = value;
                            updateSettings({
                                commands: newCommands,
                            });

                            await this.plugin.saveSettings();
                        });
                })
                .addToggle((toggle) => {
                    toggle
                        .setTooltip('Apply to whole lines')
                        .setValue(command.lines || false)
                        .onChange(async (value) => {
                            const newCommands = cloneDeep(
                                getSettings().commands,
                            );
                            newCommands[commandIndex].lines = value;
                            updateSettings({
                                commands: newCommands,
                            });

                            await this.plugin.saveSettings();
                        });
                })
                .addToggle((toggle) => {
                    toggle
                        .setTooltip('Apply to whole document')
                        .setValue(command.document || false)
                        .onChange(async (value) => {
                            const newCommands = cloneDeep(
                                getSettings().commands,
                            );
                            newCommands[commandIndex].document = value;
                            updateSettings({
                                commands: newCommands,
                            });

                            await this.plugin.saveSettings();
                        });
                })
                .addExtraButton((button) => {
                    button
                        .setIcon('info')
                        .setTooltip('View matching patterns')
                        .onClick(async () => {
                            const settings = getSettings();
                            const command = settings.commands[commandIndex];

                            const noticeTimeoutSeconds = 1000 * 30; // 30 seconds
                            const matchingPatterns = filterPatterns(
                                command,
                            ).map((patternIndex: number) =>
                                formatPatternName(patternIndex),
                            );
                            const numMatchingPatterns = matchingPatterns.length;
                            new Notice(
                                `${numMatchingPatterns} matching pattern${
                                    numMatchingPatterns !== 1 ? 's' : ''
                                }${
                                    numMatchingPatterns > 0
                                        ? '\n - "' +
                                          matchingPatterns.join('"\n - "') +
                                          '"'
                                        : ''
                                }`,
                                noticeTimeoutSeconds,
                            );
                        });
                })
                .addExtraButton((button) => {
                    button
                        .setIcon('moveRowUp')
                        .setTooltip('Move Command up')
                        .setDisabled(commandIndex === 0)
                        .onClick(async () => {
                            let newCommands = cloneDeep(getSettings().commands);
                            newCommands = moveInArray(
                                newCommands,
                                commandIndex,
                                commandIndex - 1,
                            );
                            updateSettings({
                                commands: newCommands,
                            });

                            await this.plugin.saveSettings();
                            this.display();
                        });
                })
                .addExtraButton((button) => {
                    button
                        .setIcon('moveRowDown')
                        .setTooltip('Move Rule down')
                        .setDisabled(commandIndex === commands.length - 1)
                        .onClick(async () => {
                            let newCommands = cloneDeep(getSettings().commands);
                            newCommands = moveInArray(
                                newCommands,
                                commandIndex,
                                commandIndex + 1,
                            );
                            updateSettings({
                                commands: newCommands,
                            });

                            await this.plugin.saveSettings();
                            this.display();
                        });
                })
                .addExtraButton((button) => {
                    button
                        .setIcon('cross')
                        .setTooltip('Delete command')
                        .onClick(async () => {
                            const newCommands = cloneDeep(
                                getSettings().commands,
                            );
                            newCommands.splice(commandIndex, 1);
                            updateSettings({
                                commands: newCommands,
                            });

                            await this.plugin.saveSettings();
                            this.display();
                        });
                });
        }

        const addCommandButtonEl = commandsEl.createEl('div', {
            cls: 'add-command-button-el',
        });

        new Setting(addCommandButtonEl).addButton((button) => {
            button
                .setButtonText('Add command')
                .setClass('add-command-button')
                .onClick(async () => {
                    updateSettings({
                        commands: [
                            ...getSettings().commands,
                            {
                                ...defaultCommandSettings,
                            },
                        ],
                    });
                    await this.plugin.saveSettings();
                    this.display();
                });
        });

        const importExportEl = containerEl.createDiv();
        importExportEl.addClass('import-export-div');
        importExportEl.createEl('h2', {
            text: 'Import / Export / Clear',
        });
        importExportEl.createEl('h3', {
            text: 'Patterns',
        });
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

                            // Check the structure of the data to import:
                            if (!Array.isArray(newSettings)) {
                                throw 'Settings are not in array format.';
                            }
                            newSettings.forEach(
                                (pattern: Pattern, patternIndex) => {
                                    if (!Guards.isPattern(pattern)) {
                                        throw `Pattern ${patternIndex} is not structured correctly.`;
                                    }
                                    pattern.rules.forEach(
                                        (rule: PatternRule, ruleIndex) => {
                                            if (!Guards.isPatternRule(rule)) {
                                                throw `Rule ${ruleIndex} in Pattern ${patternIndex} is not structured correctly.`;
                                            }
                                        },
                                    );
                                },
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
        importExportEl.createEl('h3', {
            text: 'Commands',
        });
        new Setting(importExportEl)
            .setDesc(
                'You can import and export commands as JSON through the clipboard, in order to more readily share commands with other users.',
            )
            .addButton((button) => {
                button
                    // .setIcon('right-arrow-with-tail')
                    .setButtonText('Import from clipboard')
                    .setClass('import-command-button')
                    .onClick(async () => {
                        try {
                            const newSettings: Command[] = JSON.parse(
                                await navigator.clipboard.readText(),
                            );

                            // Check the structure of the data to import:
                            if (!Array.isArray(newSettings)) {
                                throw 'Settings are not in array format.';
                            }
                            newSettings.forEach(
                                (command: Command, commandIndex) => {
                                    if (!Guards.isCommand(command)) {
                                        throw `Command ${commandIndex} is not structured correctly.`;
                                    }
                                },
                            );

                            updateSettings({
                                commands: [
                                    ...getSettings().commands,
                                    ...newSettings,
                                ],
                            });
                            await this.plugin.saveSettings();
                            this.display();
                            new Notice(
                                'Imported command settings from clipboard!',
                            );
                        } catch (error) {
                            new Notice(
                                'Error importing command settings from clipboard. See developer console for more information.',
                            );
                            console.log(error);
                        }
                    });
            })
            .addButton((button) => {
                button
                    // .setIcon('right-arrow-with-tail')
                    .setButtonText('Export to clipboard')
                    .setClass('export-command-button')
                    .onClick(async () => {
                        try {
                            const settings = getSettings().commands;
                            await navigator.clipboard.writeText(
                                JSON.stringify(settings, null, 2),
                            );
                            new Notice(
                                'Copied command settings as JSON to clipboard!',
                            );
                        } catch (error) {
                            new Notice(
                                'Error copying command settings as JSON to clipboard. See developer console for more information.',
                            );
                            console.log(error);
                        }
                    });
            });

        importExportEl.createEl('h3', {
            text: 'Clear all',
        });
        let clearAllSettingsPrimed = false;
        let primerTimer: ReturnType<typeof setTimeout> | null;
        const clearButtonEl = importExportEl.createEl('span');
        clearButtonEl.addClass('clear-settings-button');
        new Setting(clearButtonEl)
            .setDesc('Clear and reset all patterns and commands.')
            .addButton((button) => {
                button
                    .setButtonText('Clear all settings for this plugin')
                    .onClick(async () => {
                        if (primerTimer) {
                            clearTimeout(primerTimer);
                        }
                        if (clearAllSettingsPrimed === true) {
                            const settingsBackup = cloneDeep(getSettings());
                            try {
                                clearSettings();
                                await this.plugin.saveSettings();
                                this.display();
                                new Notice(
                                    'Apply Patterns plugin settings reset.',
                                );
                            } catch (error) {
                                new Notice(
                                    'Error clearing and resetting plugin settings.',
                                );
                                console.log(error);
                                updateSettings(settingsBackup);
                            }
                            return;
                        }
                        primerTimer = setTimeout(
                            () => {
                                button.setButtonText(
                                    'Clear all settings for this plugin',
                                );
                                clearAllSettingsPrimed = false;
                                clearButtonEl.removeClass('primed');
                            },
                            1000 * 4, // 4 second timeout
                        );
                        clearAllSettingsPrimed = true;
                        clearButtonEl.addClass('primed');
                        button.setButtonText('Click again to clear settings');
                    });
            });
    }
}
