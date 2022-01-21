import cloneDeep from 'lodash.clonedeep';
import { Notice, PluginSettingTab, Setting } from 'obsidian';
import { validateRuleString } from './ValidateRuleString';
import {
	Command,
	Guards,
	Pattern,
	PatternRule,
	clearSettings,
	defaultCommandSettings,
	defaultPatternRuleSettings,
	defaultPatternSettings,
	defaultSettings,
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

		const patternsDefaultsEl = patternsEl.createEl('div', {
			cls: 'pattern-defaults',
		});
		patternsDefaultsEl.createEl('h3', { text: `Pattern defaults` });

		const patternsDefaultStartEl = patternsDefaultsEl.createEl('div');
		const patternsDefaultStartSetting = new Setting(patternsDefaultStartEl);
		const patternsDefaultStartValidEl =
			patternsDefaultStartEl.createEl('span');
		patternsDefaultStartValidEl.addClass('validation-text');
		const patternsDefaultStartValid = validateRuleString(
			getSettings().defaultCursorRegexStart || '',
		);
		if (patternsDefaultStartValid.valid !== true) {
			patternsDefaultStartEl.addClass('invalid');
			patternsDefaultStartValidEl.setText(
				patternsDefaultStartValid.string,
			);
		}

		patternsDefaultStartSetting
			.setName('Post-pattern cursor/selection start (Regex)')
			.setDesc(
				'A regular expression to determine the default starting location of the cursor after a Pattern has been applied. The cursor will be placed at the ending location of the first match.',
			)
			.addText((text) => {
				const settings = getSettings();
				text.setValue(settings.defaultCursorRegexStart || '').onChange(
					async (value) => {
						updateSettings({
							...cloneDeep(getSettings()),
							defaultCursorRegexStart: value,
						});

						await this.plugin.saveSettings();

						const valueValid = validateRuleString(value);
						if (valueValid.valid === true) {
							patternsDefaultStartEl.removeClass('invalid');
							patternsDefaultStartValidEl.setText('');
						} else {
							patternsDefaultStartEl.addClass('invalid');
							patternsDefaultStartValidEl.setText(
								valueValid.string,
							);
						}
					},
				);
			});

		const patternsDefaultEndEl = patternsDefaultsEl.createEl('div');
		const patternsDefaultEndSetting = new Setting(patternsDefaultEndEl);
		const patternsDefaultEndValidEl = patternsDefaultEndEl.createEl('span');
		patternsDefaultEndValidEl.addClass('validation-text');
		const patternsDefaultEndValid = validateRuleString(
			getSettings().defaultCursorRegexEnd || '',
		);
		if (patternsDefaultEndValid.valid !== true) {
			patternsDefaultEndEl.addClass('invalid');
			patternsDefaultEndValidEl.setText(patternsDefaultEndValid.string);
		}

		patternsDefaultEndSetting
			.setName('Post-pattern cursor/selection end (Regex)')
			.setDesc(
				'A regular expression to determine the default ending location of the cursor after the Pattern has been applied. The cursor will be placed at the ending location of the first match.',
			)
			.addText((text) => {
				const settings = getSettings();
				text.setValue(settings.defaultCursorRegexEnd || '').onChange(
					async (value) => {
						updateSettings({
							...cloneDeep(getSettings()),
							defaultCursorRegexEnd: value,
						});

						await this.plugin.saveSettings();

						const valueValid = validateRuleString(value);
						if (valueValid.valid === true) {
							patternsDefaultEndEl.removeClass('invalid');
							patternsDefaultEndValidEl.setText('');
						} else {
							patternsDefaultEndEl.addClass('invalid');
							patternsDefaultEndValidEl.setText(
								valueValid.string,
							);
						}
					},
				);
			});

		const patternsFilterEl = patternsEl.createEl('div', {
			cls: 'pattern-filters',
		});
		patternsFilterEl.createEl('h3', { text: `Filter patterns` });

		new Setting(patternsFilterEl)
			.setName('Filter patterns by name')
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
			});

		new Setting(patternsFilterEl)
			.setName('Apply filter')
			.addButton((button) => {
				button
					.setIcon('magnifying-glass')
					.setTooltip('Filter Patterns')
					.onClick(async () => {
						this.display();
					});
			});

		new Setting(patternsFilterEl)
			.setName('Expand / Collapse all patterns')
			.addExtraButton((button) => {
				const settings = getSettings();
				const patternFilterString = settings.filterString;
				const patterns = settings.patterns;

				const visiblePatterns = patterns
					.map((pattern: Pattern, patternIndex) => {
						if (
							patternFilterString !== undefined &&
							patternFilterString !== ''
						) {
							if (
								pattern.name
									.toLowerCase()
									.includes(patternFilterString.toLowerCase())
							) {
								return {
									index: patternIndex,
									collapsed: pattern.collapsed === true,
									pattern,
								};
							}
						} else {
							return {
								index: patternIndex,
								collapsed: pattern.collapsed === true,
								pattern,
							};
						}
						return null;
					})
					.filter((e) => e !== null);

				const collapsedStatus = visiblePatterns.map(
					(e) => e !== null && e.collapsed === true,
				);

				button
					.setIcon('expand-vertically')
					.setTooltip(
						collapsedStatus.every((e) => e === true)
							? 'Expand all'
							: 'Collapse all',
					)
					.onClick(async () => {
						const settings = getSettings();
						const patternFilterString = settings.filterString;
						const patterns = settings.patterns;

						const visiblePatterns = patterns
							.map((pattern: Pattern, patternIndex) => {
								if (
									patternFilterString !== undefined &&
									patternFilterString !== ''
								) {
									if (
										pattern.name
											.toLowerCase()
											.includes(
												patternFilterString.toLowerCase(),
											)
									) {
										return {
											index: patternIndex,
											collapsed:
												pattern.collapsed === true,
											pattern,
										};
									}
								} else {
									return {
										index: patternIndex,
										collapsed: pattern.collapsed === true,
										pattern,
									};
								}
								return null;
							})
							.filter((e) => e !== null);

						const collapsedStatus = visiblePatterns.map(
							(e) => e !== null && e.collapsed === true,
						);

						if (collapsedStatus.every((e) => e === true)) {
							for (const visiblePattern of visiblePatterns) {
								if (visiblePattern !== null) {
									settings.patterns[
										visiblePattern.index
									].collapsed = false;
								}
							}
						} else if (collapsedStatus.some((e) => e === true)) {
							for (const visiblePattern of visiblePatterns) {
								if (visiblePattern !== null) {
									settings.patterns[
										visiblePattern.index
									].collapsed = true;
								}
							}
						} else {
							for (const visiblePattern of visiblePatterns) {
								if (visiblePattern !== null) {
									settings.patterns[
										visiblePattern.index
									].collapsed = true;
								}
							}
						}

						updateSettings({
							patterns: settings.patterns,
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

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

			patternEl.createEl('h3', { text: `Pattern ${patternIndex + 1}` });

			new Setting(patternEl).setName('Pattern name').addText((text) => {
				text.setPlaceholder('')
					.setValue(pattern.name)
					.onChange(async (value) => {
						const newPatterns = cloneDeep(getSettings().patterns);
						newPatterns.splice(patternIndex, 1, {
							...patterns[patternIndex],
							name: value,
						});
						updateSettings({
							patterns: newPatterns,
						});

						await this.plugin.saveSettings();
					});
			});

			let deletePatternPrimed = false;
			let patternDeletePrimerTimer: ReturnType<typeof setTimeout> | null;

			new Setting(patternEl)
				.setName('Pattern meta controls')
				.addExtraButton((button) => {
					button
						.setIcon('up-chevron-glyph')
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
						.setIcon('down-chevron-glyph')
						.setTooltip('Move Pattern down')
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
						.setIcon('cross-in-box')
						.setTooltip('Delete pattern')
						.onClick(async () => {
							if (patternDeletePrimerTimer) {
								clearTimeout(patternDeletePrimerTimer);
							}
							if (deletePatternPrimed === true) {
								const newPatterns = cloneDeep(
									getSettings().patterns,
								);
								newPatterns.splice(patternIndex, 1);
								updateSettings({
									patterns: newPatterns,
								});

								await this.plugin.saveSettings();
								this.display();
								return;
							}

							patternDeletePrimerTimer = setTimeout(
								() => {
									deletePatternPrimed = false;
									patternEl.removeClass('primed');
								},
								1000 * 4, // 4 second timeout
							);
							deletePatternPrimed = true;
							patternEl.addClass('primed');

							new Notice(
								`Click again to delete Pattern ${
									patternIndex + 1
								}`,
							);
						});
				})
				.addExtraButton((button) => {
					const updatedSettings =
						getSettings().patterns[patternIndex];
					button
						.setIcon('expand-vertically')
						.setTooltip(
							updatedSettings.collapsed !== false
								? 'Expand'
								: 'Collapse',
						)
						.onClick(async () => {
							const newPatterns = cloneDeep(
								getSettings().patterns,
							);
							newPatterns[patternIndex].collapsed =
								!newPatterns[patternIndex].collapsed;
							updateSettings({
								patterns: newPatterns,
							});

							await this.plugin.saveSettings();
							this.display();
						});
				});

			const patternRulesEl = patternEl.createEl('div');
			patternRulesEl.addClass('pattern-rules');

			const rulesEl = patternRulesEl.createEl('div');
			rulesEl.addClass('rules');

			if (getSettings().patterns[patternIndex].collapsed === true) {
				patternEl.addClass('collapsed');
			} else {
				patternEl.removeClass('collapsed');
			}

			pattern.rules.forEach((rule: PatternRule, ruleIndex) => {
				const ruleEl = rulesEl.createEl('div');
				ruleEl.addClass('rule');
				if (rule.disabled === true) {
					ruleEl.addClass('disabled');
				}

				ruleEl.createEl('h4', { text: `Rule ${ruleIndex + 1}` });

				new Setting(ruleEl)
					.setName('Toggle rule')
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
					});

				const ruleFromEl = ruleEl.createEl('div');
				const ruleFromElSetting = new Setting(ruleFromEl);
				const ruleFromValidEl = ruleFromEl.createEl('span');
				ruleFromValidEl.addClass('validation-text');
				const ruleFromValid = validateRuleString(rule.from);
				if (ruleFromValid.valid !== true) {
					ruleFromEl.addClass('invalid');
					ruleFromValidEl.setText(ruleFromValid.string);
				}

				ruleFromElSetting
					.setName('Matching text (Regex)')
					.addText((text) => {
						text.setPlaceholder('')
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

								const valueValid = validateRuleString(value);
								if (valueValid.valid === true) {
									ruleFromEl.removeClass('invalid');
									ruleFromValidEl.setText('');
								} else {
									ruleFromEl.addClass('invalid');
									ruleFromValidEl.setText(valueValid.string);
								}
							});
					});

				new Setting(ruleEl)
					.setName('Case-insensitive')
					.setDesc('Regex mode "i"')
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
					});

				new Setting(ruleEl)
					.setName('Global')
					.setDesc('Regex mode "g"')
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
					});

				new Setting(ruleEl)
					.setName('Multiline off')
					.setDesc('Regex mode "m"')
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
					});
				new Setting(ruleEl)
					.setName('Sticky')
					.setDesc('Regex mode "s"')
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
					});

				const ruleToEl = ruleEl.createEl('div');
				const ruleToElSetting = new Setting(ruleToEl);
				const ruleToValidEl = ruleFromEl.createEl('span');
				ruleToValidEl.addClass('validation-text');
				const ruleToValid = validateRuleString(rule.to, false);

				if (ruleToValid.valid !== null) {
					ruleToEl.addClass('invalid');
					ruleToValidEl.setText(ruleToValid.string);
				}

				ruleToElSetting.setName('Replacement text').addText((text) => {
					text.setPlaceholder('')
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

							const valueValid = validateRuleString(value, false);

							if (valueValid.valid === null) {
								ruleToEl.removeClass('invalid');
								ruleToValidEl.setText('');
							} else {
								ruleToEl.addClass('invalid');
								ruleToValidEl.setText(valueValid.string);
							}
						});
				});

				let deleteRulePrimed = false;
				let ruleDeletePrimerTimer: ReturnType<typeof setTimeout> | null;

				new Setting(ruleEl)
					.setName('Rule meta controls')
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
										'u' +
											(updatedRule.caseInsensitive
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
							.setIcon('up-chevron-glyph')
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
							.setIcon('down-chevron-glyph')
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
								if (ruleDeletePrimerTimer) {
									clearTimeout(ruleDeletePrimerTimer);
								}
								if (deleteRulePrimed === true) {
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
									return;
								}

								ruleDeletePrimerTimer = setTimeout(
									() => {
										deleteRulePrimed = false;
										ruleEl.removeClass('primed');
									},
									1000 * 4, // 4 second timeout
								);
								deleteRulePrimed = true;
								ruleEl.addClass('primed');

								new Notice(
									`Click again to delete Rule ${
										ruleIndex + 1
									}`,
								);
							});
					});
			});

			const addRuleButtonEl = patternRulesEl.createDiv('add-rule-button');

			new Setting(addRuleButtonEl).addButton((button) => {
				button
					.setButtonText('Add find / replace rule')
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

			const patternCursorEl = patternEl.createEl('div');
			patternCursorEl.addClass('pattern-cursor');

			const patternCursorStartEl = patternCursorEl.createEl('div');
			const patternCursorStartSetting = new Setting(patternCursorStartEl);
			const patternCursorStartValidEl =
				patternCursorStartEl.createEl('span');
			patternCursorStartValidEl.addClass('validation-text');
			const patternCursorStartValid = validateRuleString(
				pattern.cursorRegexStart,
			);
			if (patternCursorStartValid.valid !== true) {
				patternCursorStartEl.addClass('invalid');
				patternCursorStartValidEl.setText(
					patternCursorStartValid.string,
				);
			}

			patternCursorStartSetting
				.setName('Cursor/selection start (Regex)')
				.setDesc(
					'A regular expression to determine the starting location of the cursor after the Pattern has been applied. The cursor will be placed at the ending location of the first match.',
				)
				.addText((text) => {
					text.setPlaceholder('')
						.setValue(pattern.cursorRegexStart)
						.onChange(async (value) => {
							const newPatterns = cloneDeep(
								getSettings().patterns,
							);
							newPatterns.splice(patternIndex, 1, {
								...patterns[patternIndex],
								cursorRegexStart: value,
							});
							updateSettings({
								patterns: newPatterns,
							});

							await this.plugin.saveSettings();

							const valueValid = validateRuleString(value);
							if (valueValid.valid === true) {
								patternCursorStartEl.removeClass('invalid');
								patternCursorStartValidEl.setText('');
							} else {
								patternCursorStartEl.addClass('invalid');
								patternCursorStartValidEl.setText(
									valueValid.string,
								);
							}
						});
				});

			const patternCursorEndEl = patternCursorEl.createEl('div');
			const patternCursorEndSetting = new Setting(patternCursorEndEl);
			const patternCursorEndValidEl = patternCursorEndEl.createEl('span');
			patternCursorEndValidEl.addClass('validation-text');
			const patternCursorEndValid = validateRuleString(
				pattern.cursorRegexEnd,
			);
			if (patternCursorEndValid.valid !== true) {
				patternCursorEndEl.addClass('invalid');
				patternCursorEndValidEl.setText(patternCursorEndValid.string);
			}

			patternCursorEndSetting
				.setName('Cursor/selection end (Regex)')
				.setDesc(
					'A regular expression to determine the ending location of the cursor after the Pattern has been applied. The cursor will be placed at the ending location of the first match.',
				)
				.addText((text) => {
					text.setPlaceholder('')
						.setValue(pattern.cursorRegexEnd)
						.onChange(async (value) => {
							const newPatterns = cloneDeep(
								getSettings().patterns,
							);
							newPatterns.splice(patternIndex, 1, {
								...patterns[patternIndex],
								cursorRegexEnd: value,
							});
							updateSettings({
								patterns: newPatterns,
							});

							await this.plugin.saveSettings();

							const valueValid = validateRuleString(value);
							if (valueValid.valid === true) {
								patternCursorEndEl.removeClass('invalid');
								patternCursorEndValidEl.setText('');
							} else {
								patternCursorEndEl.addClass('invalid');
								patternCursorEndValidEl.setText(
									valueValid.string,
								);
							}
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
							{
								...defaultPatternSettings,
								cursorRegexStart:
									getSettings().defaultCursorRegexStart ||
									defaultSettings.defaultCursorRegexStart,
								cursorRegexEnd:
									getSettings().defaultCursorRegexEnd ||
									defaultSettings.defaultCursorRegexEnd,
							},
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
			.setName('Filter commands by name')
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
			});

		new Setting(commandsEl).setName('Apply filter').addButton((button) => {
			button
				.setIcon('magnifying-glass')
				.setTooltip('Filter Commands')
				.onClick(async () => {
					this.display();
				});
		});

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

			commandEl.createEl('h3', { text: `Command ${commandIndex + 1}` });

			new Setting(commandEl)
				.setName('Command Palette name')
				.addText((text) => {
					text.setPlaceholder('')
						.setValue(command.name)
						.onChange(async (value) => {
							const newCommands = cloneDeep(
								getSettings().commands,
							);
							newCommands.splice(commandIndex, 1, {
								...newCommands[commandIndex],
								name: value,
							});
							updateSettings({
								commands: newCommands,
							});

							await this.plugin.saveSettings();
						});
				});

			let deleteCommandPrimed = false;
			let commandDeletePrimerTimer: ReturnType<typeof setTimeout> | null;

			new Setting(commandEl)
				.setName('Command meta controls')
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
						.setIcon('up-chevron-glyph')
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
						.setIcon('down-chevron-glyph')
						.setTooltip('Move Command down')
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
						.setIcon('cross-in-box')
						.setTooltip('Delete command')
						.onClick(async () => {
							if (commandDeletePrimerTimer) {
								clearTimeout(commandDeletePrimerTimer);
							}
							if (deleteCommandPrimed === true) {
								const newCommands = cloneDeep(
									getSettings().commands,
								);
								newCommands.splice(commandIndex, 1);
								updateSettings({
									commands: newCommands,
								});

								await this.plugin.saveSettings();
								this.display();
								return;
							}

							commandDeletePrimerTimer = setTimeout(
								() => {
									deleteCommandPrimed = false;
									commandEl.removeClass('primed');
								},
								1000 * 4, // 4 second timeout
							);
							deleteCommandPrimed = true;
							commandEl.addClass('primed');

							new Notice(
								`Click again to delete Command ${
									commandIndex + 1
								}`,
							);
						});
				});

			const commandPatternNameEl = commandEl.createEl('div');
			const commandPatternNameSetting = new Setting(commandPatternNameEl);
			const commandPatternNameValidEl =
				commandPatternNameEl.createEl('span');
			commandPatternNameValidEl.addClass('validation-text');
			const commandPatternNameValid = validateRuleString(
				command.patternFilter,
			);

			if (commandPatternNameValid.valid !== true) {
				commandPatternNameEl.addClass('invalid');
				commandPatternNameValidEl.setText(
					commandPatternNameValid.string,
				);
			}

			commandPatternNameSetting
				.setName('Pattern name filter')
				.addText((text) => {
					text.setPlaceholder('')
						.setValue(command.patternFilter)
						.onChange(async (value) => {
							const newCommands = cloneDeep(
								getSettings().commands,
							);
							newCommands.splice(commandIndex, 1, {
								...newCommands[commandIndex],
								patternFilter: value,
							});
							updateSettings({
								commands: newCommands,
							});

							await this.plugin.saveSettings();

							const valueValid = validateRuleString(value);

							if (valueValid.valid === true) {
								commandPatternNameEl.removeClass('invalid');
								commandPatternNameValidEl.setText('');
							} else {
								commandPatternNameEl.addClass('invalid');
								commandPatternNameValidEl.setText(
									valueValid.string,
								);
							}
						});
				});

			new Setting(commandEl)
				.setName('Apply to selection')
				.addToggle((toggle) => {
					toggle
						.setTooltip('Apply to selection')
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
				});
			new Setting(commandEl)
				.setName('Apply to whole lines')
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
				});

			new Setting(commandEl)
				.setName('Apply to whole document')
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
				});

			new Setting(commandEl)
				.setName('Apply to whole clipboard')
				.setDesc(
					'Apply the Pattern as with "Apply to whole document" to the clipboard.',
				)
				.addToggle((toggle) => {
					toggle
						.setTooltip('Apply to whole whole clipboard')
						.setValue(command.clipboard || false)
						.onChange(async (value) => {
							const newCommands = cloneDeep(
								getSettings().commands,
							);
							newCommands[commandIndex].clipboard = value;
							updateSettings({
								commands: newCommands,
							});

							await this.plugin.saveSettings();
						});
				});

			new Setting(commandEl)
				.setName('Apply to clipboard (line-by-line)')
				.setDesc(
					'Apply the Pattern as with "Apply to whole lines" to the clipboard.',
				)
				.addToggle((toggle) => {
					toggle
						.setTooltip('Apply to whole whole clipboard')
						.setValue(command.clipboardLines || false)
						.onChange(async (value) => {
							const newCommands = cloneDeep(
								getSettings().commands,
							);
							newCommands[commandIndex].clipboardLines = value;
							updateSettings({
								commands: newCommands,
							});

							await this.plugin.saveSettings();
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
		importExportEl.createEl('p', {
			text: 'You can import and export patterns as JSON through the clipboard, in order to more readily share patterns with other users.',
		});
		new Setting(importExportEl)
			.setName('Import patterns from clipboard')
			.addButton((button) => {
				button
					// .setIcon('right-arrow-with-tail')
					.setButtonText('Import')
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
			});

		new Setting(importExportEl)
			.setName('Export patterns to clipboard')
			.addButton((button) => {
				button.setButtonText('Export').onClick(async () => {
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
		importExportEl.createEl('p', {
			text: 'You can import and export commands as JSON through the clipboard, in order to more readily share commands with other users.',
		});

		new Setting(importExportEl)
			.setName('Import commands from clipboard')
			.addButton((button) => {
				button.setButtonText('Import').onClick(async () => {
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
						new Notice('Imported command settings from clipboard!');
					} catch (error) {
						new Notice(
							'Error importing command settings from clipboard. See developer console for more information.',
						);
						console.log(error);
					}
				});
			});
		new Setting(importExportEl)
			.setName('Export commands to clipboard')
			.addButton((button) => {
				button
					// .setIcon('right-arrow-with-tail')
					.setButtonText('Export')
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
			.setName('Clear and reset all patterns and commands.')
			.addButton((button) => {
				button.setButtonText('Delete all').onClick(async () => {
					if (primerTimer) {
						clearTimeout(primerTimer);
					}
					if (clearAllSettingsPrimed === true) {
						const settingsBackup = cloneDeep(getSettings());
						try {
							clearSettings();
							await this.plugin.saveSettings();
							this.display();
							new Notice('Apply Patterns plugin settings reset.');
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
