// @ts-check

// Enhanced Module Configuration
;(function() {

//#region Init & "global" variables ----------------------------------------------

// @ts-ignore
var EM = window.ExternalModules
if (typeof EM == 'undefined') {
    /** @type {ExternalModules} */
    EM = {}
    // @ts-ignore
    window.ExternalModules = EM
}

/** @type {JQuery} */
var $modal = null
/** @type {ModuleSettingsInfos} Module Settings */
var settings = {}
/** @type {ModuleInfo} Module Info */
var module = {}

//#endregion

//#region Branching --------------------------------------------------------------

/**
 * Applies initial branching logic recursively.
 * @param {ModuleSetting} setting 
 */
function initialBranchingLogic(setting = null) {
    if (setting == null) {
        Object.keys(settings.current).forEach(function(key) {
            var setting = settings.current[key]
            initialBranchingLogic(setting)
        })
    }
    else {
        applyBranchingLogic(setting);
        // Process nested.
        if (setting.hassubs) {
            Object.keys(setting.sub).forEach(function(ss_key) {
                if (ss_key != '') {
                    var subsettings = setting.sub[ss_key]
                    Object.keys(subsettings).forEach(function(key) {
                        initialBranchingLogic(subsettings[key])
                    })
                }
            })
        }
    }
}

/**
 * Applies branching logic to a setting value (or all settings).
 * @param {ModuleSetting} setting 
 */
function applyBranchingLogic(setting) {
    var key = setting.config.key
    // var instance = $('[data-emc-field="' + key + '"]').attr('data-emc-instance')
    var instance = 0
    // var guid = $('[data-emc-field="' + key + '"]').attr('data-emc-guid')
    var guid = setting.guid
    if (setting.dependencies.dependsOn.length) {
        // Get values for evaluating branching logic
        var blValues = {}
        setting.dependencies.dependsOn.forEach(function(depKey) {
            blValues[depKey] = getDependencyValue(setting, depKey)
        })
        // Evaluate the branching logic expression.
        var blResult = evaluateBranchingLogic(setting.config.branchingLogic, blValues)
        settings.values[guid].hidden = !blResult
        var $setting = $('[data-emc-guid="' + guid + '"]')
        if (blResult) {
            $setting.removeClass('emc-branching-hidden')
        }
        else {
            $setting.addClass('emc-branching-hidden')
        }
        debugLog('Processed branching for ' + key + ' [' + instance + '] - ' + guid + ' = ' + blResult)
    }
}

/**
 * 
 * @param {ModuleSetting} setting 
 * @param {string} key
 */
function processDependingBranching(setting, key) {
    if (setting.dependencies.dependsOn.includes(key)) {
        applyBranchingLogic(setting)
    }
    if (setting.hassubs) {
        Object.keys(setting.sub).forEach(function(ss_key) {
            if (ss_key != '') {
                var subsettings = setting.sub[ss_key]
                Object.keys(subsettings).forEach(function(subKey) {
                    var subsetting = subsettings[subKey]
                    processDependingBranching(subsetting, key)
                })
            }
        })
    }
}

/**
 * Evaluates a branching logic expression.
 * @param {BranchingLogic} logic 
 * @param {Object<string,any>} values
 * @returns {boolean}
 */
function evaluateBranchingLogic(logic, values) {
    /** @type {BranchingLogicCondition[]} conditions */
    var conditions = []
    var type = logic.type === undefined ? 'and' : logic.type
    if (logic['conditions'] === undefined) {
        conditions.push({
            field: logic.field,
            value: logic.value,
            op: logic.op === undefined ? '=' : logic.op
        })
    }
    else {
        logic.conditions.forEach(function(condition) {
            conditions.push({
                field: condition.field,
                value: condition.value,
                op: condition.op === undefined ? '=' : condition.op
            })
        })
    }
    var conditionResults = []
    conditions.forEach(function(condition) {
        var value = values[condition.field]
        conditionResults.push(evaluateCondition(condition, value))
    })
    var result = type == 'and'
    conditionResults.forEach(function(cr) {
        if (type == 'and') {
            result = result && cr
        } 
        else {
            result = result || cr
        }
    })
    return result
}

/**
 * 
 * @param {BranchingLogicCondition} condition 
 * @param {any} fvalue The field value 
 */
function evaluateCondition(condition, fvalue) {
    if (typeof fvalue === 'boolean') {
        return condition.op == '=' ? condition.value === fvalue : condition.value !== fvalue
    }
    var cvalue = condition.value
    var numerical = !isNaN(fvalue) && !isNaN(cvalue)
    if (numerical) {
        fvalue = 1 * fvalue
        cvalue = 1 * cvalue
        switch (condition.op) {
            case "=": return fvalue == cvalue
            case "<>": return fvalue != cvalue
            case "!=": return fvalue != cvalue
            case "<": return fvalue < cvalue
            case "<=": return fvalue <= cvalue
            case ">": return fvalue > cvalue
            case ">=": return fvalue >= cvalue
        }
    }
    else {
        if (condition.op == "=") return fvalue == cvalue
        if (condition.op == "<>") return fvalue != cvalue
        if (condition.op == "!=") return fvalue != cvalue
    }
    // Default.
    return false
}

/**
 * Gets the value of an upstream/sibling setting.
 * @param {ModuleSetting} setting 
 * @param {string} key 
 */
function getDependencyValue(setting, key) {
    if (setting == null) return null
    if (setting.siblings[key] !== undefined) {
        return settings.values[setting.siblings[key].guid].value
    }
    return getDependencyValue(setting.parent, key)
}

//#endregion

//#region Getting/Setting Values -------------------------------------------------

/**
 * Updates values and initiates branching logic processing.
 * @param {JQuery} $field 
 * @param {ModuleSetting} setting 
 */
function valueChanged($field, setting) {
    if (!settings.updating) {
        var value = []
        $field.find('.emc-value').each(function() {
            value.push(getValue(setting, $(this)))
        })
        if (!setting.repeats) {
            value = value[0]
        }
        // Store value in guid lookup.
        settings.values[setting.guid].value = value
        debugLog('Updated value for ' + setting.config.key + ': ' + value)
        // Process branching logic for self and siblings.
        if (setting.dependencies.depending.length) {
            processDependingBranching(setting, setting.config.key)
            Object.keys(setting.siblings).forEach(function(sibKey) {
                var sibSetting = setting.siblings[sibKey]
                processDependingBranching(sibSetting, setting.config.key)
            })
        }
    }
}

/**
 * Sets the value.
 * @param {ModuleSetting} setting 
 * @param {JQuery} $value 
 * @param {any} value 
 */
function setValue(setting, $value, value) {
    switch(setting.type) {
        case 'textarea': {
            $value.val(value)
            $value.trigger('keyup')
            break
        }
        case 'checkbox': {
            $value.prop('checked', value == true)
            break
        }
        case 'file': {
            // Can only ever set to empty string.
            $value.val('')
            // @ts-ignore
            bsCustomFileInput.destroy()
            // @ts-ignore
            bsCustomFileInput.init()
            break
        }
        default: {
            $value.val(value)
            break
        }
    }
}

/**
 * Gets the value.
 * @param {ModuleSetting} setting 
 * @param {JQuery} $value 
 */
function getValue(setting, $value) {
    switch(setting.type) {
        case 'checkbox': {
            return $value.prop('checked') == true
        }
        default: {
            return $value.val()
        }
    }
}

/**
 * Sets the value of a control.
 * @param {ModuleSetting} setting 
 * @param {number} instance
 */
function setControlValue(setting, instance = null) {
    var $value = findValue(setting, instance)
    var value = settings.values[setting.guid].value
    if (instance !== null) {
        value = value[instance]
    }
    setValue(setting, $value, value)
}

/**
 * Sets the value of a control.
 * @param {ModuleSetting} setting 
 * @param {number} instance
 */
function getControlValue(setting, instance = null) {
    var $value = findValue(setting, instance)
    return getValue(setting, $value)
}

/**
 * Finds the value element.
 * @param {ModuleSetting} setting 
 * @param {number} instance
 * @returns {JQuery} 
 */
function findValue(setting, instance) {
    var $setting = $('.emc-setting[data-emc-guid="' + setting.guid + '"]')
    var $value = $setting.find('.emc-value')
    if (instance !== null && Number.parseInt($value.attr('data-emc-instance')) != instance) {
        $value = $value.parent().find('[data-emc-instance="' + instance + '"]')
    }
    return $value
}

//#endregion

//#region Add / Delete Repeat Instances ------------------------------------------

/**
 * Recursively gets all guids in a setting subtree.
 * @param {ModuleSetting} setting 
 * @param {string[]} guids 
 */
function getAllGuids(setting, guids) {
    guids.push(setting.guid)
    if (setting.hassubs) {
        Object.keys(setting.sub).forEach(function(ss_instance) {
            if (ss_instance != '') {
                Object.keys(setting.sub[ss_instance]).forEach(function(ss_key) {
                    var subsetting = setting.sub[ss_instance][ss_key]
                    getAllGuids(subsetting, guids)
                })
            }
        })
    }
}

/**
 * Deletes a specific (instance of a) control.
 * @param {ModuleSetting} setting 
 * @param {number} instance 
 */
function deleteRepeatInstance(setting, instance) {
    debugLog('Deleting instance ' + instance + ' of ' + setting.config.key)
    if (setting.hassubs) {
        // Walk down the sub tree and gather the guids.
        var guids = []
        Object.keys(setting.sub[instance]).forEach(function(ss_key) {
            var subsetting = setting.sub[instance][ss_key]
            getAllGuids(subsetting, guids)
        })
        // Delete instance and values.
        guids.forEach(function(guid) {
            delete settings.values[guid]
        })
        delete setting.sub[instance]
        setting.count--
        if (setting.count > 0) {
            // Reorder instances.
            /** @type {Object<string, Object<string,ModuleSetting>>} sub */
            var sub = {}
            var i = 0
            Object.keys(setting.sub).forEach(function(old_i) {
                if (old_i == '') {
                    sub[old_i] = setting.sub[old_i]
                }
                else {
                    sub[i.toString()] = setting.sub[old_i]
                    i++
                }
            })
            setting.sub = sub
            // Refresh.
            var newInstance = Math.max(0, instance - 1)
            showSubRepeat(setting, newInstance)
        }
        else {
            // Update and go to parent.
            var parentInstance = Number.parseInt($('.emc-setting[data-emc-field="' + setting.config.key + '"]').attr('data-emc-instance'))
            showSubRepeat(setting.parent, parentInstance)
        }
    }
    else if (setting.repeats && setting.count > 1) {
        // Remove.
        settings.values[setting.guid].value.splice(instance, 1)
        setting.count--
        updateRepeatingField(setting)
    }
    else {
        // Clear.
        settings.values[setting.guid].value = setting.repeats ? [ null ] : null
        var instance = setting.repeats ? 0 : null
        setControlValue(setting, instance)
        setFocus(setting, 0)
    }
}

/**
 * Deletes a specific (instance of a) control.
 * @param {ModuleSetting} setting 
 * @param {number} instance 
 */
function setFocus(setting, instance) {
    findValue(setting, instance).focus()
}

/**
 * Adds a new instance. In case of repeating subsettings, switches to the subsetting body.
 * @param {ModuleSetting} setting 
 */
function addRepeatInstance(setting) {
    debugLog('Adding instance to ' + setting.config.key)
    if (setting.hassubs && setting.repeats) {
        // Repeating sub settings.
        var newInstance = setting.count
        setting.count++
        // Add a subsettings clone and intialize.
        setting.sub[newInstance] = JSON.parse(JSON.stringify(setting.sub['']))
        mapSubGuids(setting, newInstance)
        // Refresh UI.
        showSubRepeat(setting, newInstance)
        setFocus(setting, newInstance)
    }
    else {
        // Repeating regular settings.
        settings.values[setting.guid].value.push(null)
        setting.count++
        updateRepeatingField(setting)
        setFocus(setting, setting.count - 1)
    }
}

/**
 * Updates a repeating field after an instance has been added or removed.
 * @param {ModuleSetting} setting 
 */
function updateRepeatingField(setting) {
    var $f = $modal.find('.emc-setting[data-emc-guid="' + setting.guid + '"]')
    var $sf = $f.find('.emc-setting-field')
    var $cache = $('<div></div>').append($sf.children())
    for (var i = 0; i < setting.count; i++) {
        var value = settings.values[setting.guid].value[i]
        if (value) {
            // Must be in cache - restore.
            for (var j = 1; j <= $cache.children().length; j++) {
                var $child = $cache.find('.emc-control:nth-child(' + j + ')')
                var $value = $child.find('.emc-value')
                var cacheValue = getValue(setting, $value)
                if (cacheValue === value) {
                    // Update instance and add.
                    $value.attr('data-emc-instance', i)
                    $sf.append($child)
                    break
                }
            }
        }
        else {
            // Add new
            var $control = getSettingTemplate(setting.config)
            var id = 'emcSetting-' + setting.config.key + '-' + uuidv4()
            $control.find('.emc-setting-labeltarget').attr('id', id)
            // Placeholder.
            $control.find('input[type="text"]').attr('placeholder', setting.config.placeholder)
            // Set value.
            var $value = $control.find('.emc-value')
            $value.attr('data-emc-instance', i)
            setValue(setting, $value, value)
            // Hook up events.
            $value.on('change', function() {
                valueChanged($f, setting)
            })
            $control.find('.emc-clear').on('click', function(e) {
                var $el = $(e.target)
                while (!$el.hasClass('emc-control')) {
                    $el = $el.parent()
                }
                var instance = Number.parseInt($el.find('.emc-value').attr('data-emc-instance'))
                deleteRepeatInstance(setting, instance)
            })
            // Append to parent.
            $sf.append($control)
        }
    }
    // Cleanup cache.
    $cache.children().remove()
    $cache = null
    // Marry up label with control.
    var id = $f.find('.emc-setting-labeltarget').first().attr('id')
    $sf.find('[aria-labelled-by]').attr('aria-labelled-by', id)
    $f.find('.emc-setting-label').attr('for', id)
    initializeField(setting, $f)
}

//#endregion

//#region Build Settings ---------------------------------------------------------

/**
 * Sets name, description and help texts.
 * @param {ModuleSetting} setting 
 * @param {JQuery} $el 
 */
function setNameDescription(setting, $el) {
    $el.find('.emc-setting-label-text').html(setting.config.name)
    if (setting.config['help-text'] || setting.config['help-url']) {
        $el.find('.emc-setting-help').attr('data-emc-setting-help', setting.config.key)
    }
    else {
        $el.find('.emc-setting-help').remove()
    }
    $el.find('.emc-setting-description').html(setting.config.description)
}

/**
 * Gets subsetting tabs.
 * @param {ModuleSetting} setting
 * @returns {TabInfo[]}
 */
function getSubTabs(setting) {
    var tabKeys = []
    Object.keys(setting.sub['']).forEach(function(ss_key) {
        var tabKey = setting.sub[''][ss_key].config.tab
        tabKey = tabKey == 'module-reserved-tab' ? 'module-reserved-sub' : tabKey
        tabKeys.push(tabKey)
    })
    /** @type {TabInfo[]} tabs */
    var tabs = []
    Object.keys(settings.tabs).forEach(function(tabKey) {
        if (tabKeys.includes(tabKey)) {
            tabs.push(settings.tabs[tabKey])
        }
    })
    return tabs
}

/**
 * Builds a modal body for repeating subsettings.
 * @param {ModuleSetting} setting
 * @param {number} instance
 */
function buildSubsettingBody(setting, instance) {
    // Already constructed?
    if ($('.emc-subrepeat-body[data-emc-field="' + setting.config.key + '"]').length) return
    // Body.
    var $body = getTemplate('emcSubRepeat-body')
    $body.attr('data-emc-field', setting.config.key)
    // Header.
    var $header = getTemplate('emcSubRepeat-header')
    $header.attr('data-emc-field', setting.config.key)
    var $f = getTemplate('emcSetting')
    setNameDescription(setting, $f)
    $f.attr('data-emc-field', setting.config.key)
    $f.attr('data-emc-instance', instance)
    // Insert subsetting instance buttons container.
    insertPart($f, 'emcSubRepeat')
    // Add new instance button.
    insertPart($f, 'emcAddInstance')
    $f.find('.emc-repeat-add').on('click', function() {
        addRepeatInstance(setting)
    })
    // Back to parent link.
    insertPart($f, 'emcSubRepeat-parent')
    if (setting.parent) {
        $f.find('.emc-subrepeat-parent-text').html(setting.parent.config.name)
        insertPart($f, 'emcSubRepeat-parent-instance')
        $f.find('.emc-subrepeat-parent-instance').text(instance + 1)
    }
    else {
        $f.find('.emc-subrepeat-parent-text').html(settings.tabs[setting.config.tab].name)
    }
    $f.find('.emc-subrepeat-parent-link').on('click', function() {
        showSubRepeat(setting.parent, instance)
    })
    $header.prepend($f)
    // Tabs and panels.
    var tabs = getSubTabs(setting)
    insertPart($header, 'emcSubRepeat-tabs')
    tabs.forEach(function(tabInfo) {
        // Tabs (added to header).
        var tabId = 'emcSubTab-' + setting.config.key + '-' + tabInfo.key
        var panelId = 'emcSubPanel-' + setting.config.key + '-' + tabInfo.key
        var $tab = getTemplate('emcTabItem')
        var $a = $tab.find('a')
        $a.attr('id', tabId)
        $a.attr('href', '#' + panelId)
        $a.attr('aria-controls', panelId)
        $tab.find('.emc-tab-link-text').html(tabInfo.name)
        if (tabInfo['help-text'] || tabInfo['help-url']) {
            $tab.find('.emc-tab-help').attr('data-emc-tab-help', tabInfo.key)
        }
        else {
            $tab.find('.emc-tab-help').remove()
        }
        $header.find('ul.emc-subtabs').append($tab)
        // Panels (added to body).
        var $panel = getTemplate('emcSubTabPanel')
        $panel.attr('id', panelId)
        $panel.attr('aria-labelledby', tabId)
        $body.find('.emc-subtab-container').append($panel)
    })
    $modal.find('.emc-modal-header').after($body)
    $modal.find('.emc-modal-header').after($header)
    // Show default panel.
    var defaultTabId = '#emcSubTab-' + setting.config.key +  '-module-reserved-sub'
    $(defaultTabId).tab('show')
    // Only one tab? Remove tabs.
    if (tabs.length == 1) {
        $header.find('.emc-subtabs').remove()
    }
    // Fields are added on the fly when the subsettings are shown
}

/**
 * Shows the subrepeat body or the default body when setting == null.
 * @param {ModuleSetting} setting 
 * @param {number} instance 
 */
function showSubRepeat(setting, instance) {
    if (setting == null) {
        debugLog('Showing root fields')
        // Update root instance buttons - these may have changed.
        Object.keys(settings.current).forEach(function(key) {
            var setting = settings.current[key]
            if (setting.hassubs && setting.repeats) {
                var $instanceButtons = $modal.find('.emc-default-body .emc-setting[data-emc-field="' + setting.config.key + '"] .emc-repeat-buttons')
                $instanceButtons.children().remove()
                var count = parseInt(setting.count)
                for (var i = 0; i < count; i++) {
                    var $btn = getTemplate('emcSubRepeat-button')
                    $btn.attr('data-emc-instance', i)
                    $btn.find('.emc-subrepeat-buttonlabel').text(i + 1)
                    $btn.on('click', function(e) {
                        var $btn = findRepeatButton(e)
                        var instance = parseInt($btn.attr('data-emc-instance'))
                        showSubRepeat(setting, instance)
                    })
                    $instanceButtons.append($btn)
                }
                if (count == 0) {
                    $instanceButtons.append(getTemplate('emcSubRepeat-empty'))
                }
            }
        })
        $modal.find('.emc-subrepeat-body').hide(settings.hideDuration)
        $modal.find('.emc-default-body').show(settings.showDuration)
    }
    else {
        debugLog('Showing ' + setting.config.key + ', instance ' + instance)
        // Set data.
        settings.updating = true
        // Update instance buttons.
        var $header = $modal.find('.emc-subrepeat-header[data-emc-field="' + setting.config.key + '"]')
        var $instanceButtons = $header.find('.emc-repeat-buttons')
        $instanceButtons.children().remove()
        var count = parseInt(setting.count)
        for (var i = 0; i < count; i++) {
            var $btn = getTemplate('emcSubRepeat-button')
            $btn.attr('data-emc-instance', i)
            $btn.find('.emc-subrepeat-buttonlabel').text(i + 1)
            if (i == instance) {
                $btn.switchClass('btn-secondary', 'btn-primary', 100)
            }
            else {
                $btn.on('click', function(e) {
                    var $btn = findRepeatButton(e)
                    var instance = parseInt($btn.attr('data-emc-instance'))
                    showSubRepeat(setting, instance)
                })
            }
            $instanceButtons.append($btn)
        }
        if (count == 0) {
            $instanceButtons.append(getTemplate('emcSubRepeat-empty'))
        }
        else {
            insertPart($header, 'emcSubRepeat-delete')
            var $delete = $header.find('.emc-subrepeat-delete')
            $delete.attr('data-emc-field', setting.config.key)
            $delete.attr('data-emc-instance', instance)
            $delete.on('click', function() {
                deleteRepeatInstance(setting, instance)
            })
        }
        // Update fields (remove, re-add).
        var $fields = $modal.find('.emc-subrepeat-fields[data-emc-field="' + setting.config.key + '"]')
        $fields.find('.emc-subtab-panel').children().remove()
        addFields(setting.sub[instance], 'emcSubPanel-' + setting.config.key)
        initialBranchingLogic(setting)
        settings.updating = false
        // Hide/Show modal bodies.
        $modal.find('.emc-default-body').hide(settings.hideDuration)
        $modal.find('.emc-subrepeat-body').each(function() {
            var $this = $(this)
            var field = $this.attr('data-emc-field')
            if (field == setting.config.key) {
                $this.show(settings.showDuration)
            }
            else {
                $this.hide(settings.hideDuration)
            }
        })
    }
}

/**
 * Finds the ancestor button element.
 * @param {JQuery.ClickEvent<HTMLElement, undefined, HTMLElement, HTMLElement>} e
 */
function findRepeatButton(e) {
    var $btn = $(e.target)
    while (!$btn.is('button')) {
        $btn = $btn.parent()
    }
    return $btn
}

/**
 * Initializes Select2 for a dropdown.
 * @param {JQuery} $field 
 */
function initializeSelect($field) {
    // Initialize Select2.
    var $select = $field.find('select')
    $select.select2({
        dropdownParent: $modal,
        theme: 'bootstrap-5'
    })
    $field.find('.emc-value').each(function() {
        if (!$(this).is('select')) {
            $(this).removeClass('emc-value')
        }
    })
}

/**
 * Initializes Bootstrap Custom File fields.
 */
function initializeFile() {
    // @ts-ignore
    bsCustomFileInput.destroy()
    // @ts-ignore
    bsCustomFileInput.init()
}

/**
 * Builds a field.
 * @param {ModuleSetting} setting
 * @param {string} key
 * @param {number} instance
 * @returns {JQuery}
 */
function buildField(setting, key, instance = 0) {
    var baseId = 'emcSetting-' + key
    // Get outer template.
    var $f = getTemplate('emcSetting')
    // Configure label part.
    setNameDescription(setting, $f)
    // Add field and instance.
    $f.attr('data-emc-field', key)
    $f.attr('data-emc-guid', setting.guid)
    $f.attr('data-emc-instance', instance)
    // Minimum 1, maximum 1 for type 'sub_settings'.
    var count = parseInt(setting.count)
    var n = (setting.type == 'sub_settings') ? 1 : Math.max(1, count)
    var $sf = $f.find('.emc-setting-field')
    // Add control template(s).
    if (setting.type == 'sub_settings' && !setting.repeats) {
        // Non-repeating subsettings - recurse buildField.
        Object.keys(setting.sub[0]).forEach(function(ss_key) {
            var subsetting = setting.sub[0][ss_key]
            var $ss_field = buildField(subsetting, ss_key, instance)
            $sf.append($ss_field)
        })
        if ($sf.children().length) {
            $sf.addClass('emc-setting-field-indent')
        }
    }
    else {
        if (setting.type == 'sub_settings' && setting.repeats) {
            // Repeating subsettings.
            var $control = getSettingTemplate(setting.config)
            // Add subsetting instance buttons.
            for (var i = 0; i < count; i++) {
                var id = baseId + '-' + uuidv4()
                var $btn = getTemplate('emcSubRepeat-button')
                $btn.attr('id', id)
                $btn.attr('data-emc-instance', i)
                $btn.attr('data-emc-field', setting.config.key)
                $btn.find('.emc-subrepeat-buttonlabel').text(i + 1)
                $btn.on('click', function(e) {
                    var $btn = findRepeatButton(e)
                    var instance = Number.parseInt($btn.attr('data-emc-instance'))
                    showSubRepeat(setting, instance)
                })
                $control.append($btn)
            }
            if (count == 0) {
                $control.append(getTemplate('emcSubRepeat-empty'))
            }
            // Append to parent.
            $sf.append($control)
            // Build subsetting body.
            buildSubsettingBody(setting, instance)
        }
        else {
            // Regular (repeating) control.
            for (var i = 0; i < n; i++) {
                var id = baseId + '-' + uuidv4()
                var $control = getSettingTemplate(setting.config)
                $control.find('.emc-setting-labeltarget').attr('id', id)
                // Placeholder.
                $control.find('input[type="text"]').attr('placeholder', setting.config.placeholder)
                // Set value.
                var $value = $control.find('.emc-value')
                $value.attr('data-emc-instance', i)
                var value = setting.repeats ? 
                    settings.values[setting.guid].value[i] : 
                    settings.values[setting.guid].value
                setValue(setting, $value, value)
                // Hook up events.
                $value.on('change', function() {
                    valueChanged($f, setting)
                })
                $control.find('.emc-clear').on('click', function(e) {
                    var $el = $(e.target)
                    while (!$el.hasClass('emc-control')) {
                        $el = $el.parent()
                    }
                    var instance = Number.parseInt($el.find('.emc-value').attr('data-emc-instance'))
                    deleteRepeatInstance(setting, instance)
                })
                // Append to parent.
                $sf.append($control)
            }
            // Marry up label with control.
            var id = $f.find('.emc-setting-labeltarget').first().attr('id')
            $sf.find('[aria-labelled-by]').attr('aria-labelled-by', id)
            $f.find('.emc-setting-label').attr('for', id)
        }
    }
    // Add "add more" stub for repeating settings (and subsettings).
    if (setting.repeats) {
        insertPart($f, 'emcAddInstance')
        $f.find('.emc-repeat-add').on('click', function() {
            addRepeatInstance(setting)
        })
    }
    return $f
}

/**
 * Builds and adds fields to panels.
 * @param {Object<string, ModuleSetting>} settings
 * @param {string} panelPrefix
 */
function addFields(settings, panelPrefix) {
    Object.keys(settings).forEach(function(key) {
        var setting = settings[key]
        var $field = buildField(setting, key)
        // Append to the correct tab.
        $('#' + panelPrefix + '-' + setting.config.tab).append($field)
        // Some fields must be initialized.
        initializeField(setting, $field)
    })
}

/**
 * Initializes certain types of fields.
 * @param {ModuleSetting} setting 
 * @param {JQuery} $field 
 */
function initializeField(setting, $field) {
    switch (setting.type) {
        case 'dropdown':
            initializeSelect($field)
            return
        case 'file':
            initializeFile()
            return
        case 'textarea':
            // @ts-ignore
            $field.find('.emc-textarea').textareaAutoSize()
            setTimeout(function() {
                $field.find('.emc-textarea').trigger('keyup')
            }, 0)
            return
    }
}

/**
 * Sets up a dropdown form element.
 * @param {JQuery} $dropdown 
 * @param {SettingConfig} config 
 */
function prepareDropdown($dropdown, config) {
    var $select = $dropdown.find('select')
    $select.children().remove()
    config.choices.forEach(function(choice) {
        var $option = $('<option></option>')
        $option.text(choice.name)
        $option.attr('value', choice.value)
        $select.append($option)
    })
}

/**
 * Gets a template by type.
 * @param {SettingConfig} config The type of the setting (as in config.json).
 * @returns {JQuery} The jQuery representation of the template's content.
 */
function getSettingTemplate(config) {
    // Assemble templates.
    switch (config.type) {
        case 'descriptive': return $('<div></div>')
        case 'checkbox': return getTemplate('emcSwitch')
        case 'text':
        case 'email': {
            var $tpl = getTemplate('emcTextbox')
            if (config.repeatable) {
                insertPart($tpl, 'emcRepeatable')
            }
            if (config.type == 'email') {
                insertPart($tpl, 'emcTextbox-email')
            }
            return $tpl
        }
        case 'dropdown': {
            var $tpl = getTemplate('emcDropdown')
            prepareDropdown($tpl, config)
            return $tpl
        }
        case 'textarea': 
        case 'json': {
            var $tpl = getTemplate('emcTextarea')
            if (config.repeatable) {
                insertPart($tpl, 'emcRepeatable')
            }
            if (config.type == 'json') {
                insertPart($tpl, 'emcTextarea-json')
            }
            return $tpl
        }
        case 'file': {
            var $tpl = getTemplate('emcFilebrowser')
            return $tpl
        }
        case 'sub_settings': {
            var $tpl = getTemplate('emcSubRepeat')
            return $tpl
        }
    }
    return getTemplate('emcNotImplemented')
}

/**
 * @param {JQuery<HTMLElement>} $template
 * @param {string} name
 */
function insertPart($template, name) {
    var $part = getTemplate(name)
    var $target = $template.find('.' + $part.attr('data-emc-target')).first()
    var mode = $part.attr('data-emc-insert')
    switch (mode) {
        case 'prepend': $target.prepend($part); break;
        case 'append': $target.append($part); break;
        case 'before': $target.before($part); break;
        case 'after': $target.after($part); break;
    }
}

/**
 * Gets a template by name.
 * @param {string} name The name of the template (i.e. value of the data-emc attribute).
 * @returns {JQuery} The jQuery representation of the template's content.
 */
function getTemplate(name) {
    // @ts-ignore
    return $(document.querySelector('template[data-emc=' + name + ']').content.firstElementChild.cloneNode(true))
}

//#endregion

//#region Create Dialog ----------------------------------------------------------

/**
 * Shows the (static) initialization error and logs more details to the console.
 * @param {string} msg The error message.
 */
function initError(msg) {
    $modal.find('.emc-loading').hide()
    $modal.find('.emc-initerror').show()
    console.warn(msg);
}

/**
 * Adds the main tabs.
 */
function addMainTabs() {
    Object.keys(settings.tabs).forEach(function(tabKey) {
        var tabInfo = settings.tabs[tabKey]
        if (tabInfo.main) {
            // Tab
            var $tab = getTemplate('emcTabItem')
            var $a = $tab.find('a')
            $a.attr('id', 'emcMainTab-' + tabKey)
            $a.attr('href', '#emcMainPanel-' + tabKey)
            $a.attr('aria-controls', 'emcMainPanel-' + tabKey)
            $tab.find('.emc-tab-link-text').html(tabInfo.name)
            if (tabInfo['help-text'] || tabInfo['help-url']) {
                $tab.find('.emc-tab-help').attr('data-emc-tab-help', tabKey)
            }
            else {
                $tab.find('.emc-tab-help').remove()
            }
            $('ul.emc-tabs').append($tab)
            // Panel
            var $panel = getTemplate('emcTabPanel')
            $panel.attr('id', 'emcMainPanel-' + tabKey)
            $panel.attr('aria-labelledby', 'emcMainTab-' + tabKey)
            $('.emc-tab-container').append($panel)
        }
    })
}

/**
 * Activates the initial main tab after the dialog was created.
 */
function setInitialTab() {
    // Empty tabs? Find out (and add empty note while doing so).
    var notEmpty = $('.emc-tab-panel').toArray().filter(function(panel) {
        if (!panel.children.length) {
            $(panel).append(getTemplate('emcTabEmpty'))
            return false
        }
        return true
    }).map(function(panel) {
        return panel.getAttribute('aria-labelledby')
    })
    // Activate a tab (give priority to module-reserved-tab).
    var defaultName = 'emcMainTab-module-reserved-tab'
    var defaultTab = '#' + notEmpty.reduce(function(prev, cur) {
        if (prev == defaultName || cur == defaultName) 
            return defaultName
        return prev.length ? prev : cur
    },'')
    if (defaultTab != '#') {
        $(defaultTab).tab('show')
    }
    else {
        $('.emc-tab-link:first').tab('show')
    }
}

/**
 * Adds final touches and removes the spinner.
 */
function finalize() {
    // Initialize textarea autosizing
    // @ts-ignore
    $('.emc-textarea').textareaAutoSize()
    setTimeout(function() {
         $('.emc-textarea').trigger('keyup')
    }, 0)
    // Autosize on tab shown.
    $('.emc-tab-link').on('shown.bs.tab', function() {
        $('.emc-textarea').trigger('keyup')
        debugLog('Autosized after tab switch.')
    })
    // Hide sub repeat bodies.
    showSubRepeat(null, 0)
    // Hide blocking overlay and remove init-only items.
    $modal.find('.emc-default-body').show()
    $modal.find('.emc-loading').hide()
    $modal.find('.emc-overlay').fadeOut(200, function() {
        $modal.find('.emc-modal-wrapper').children().appendTo($modal.find('.modal-content'))
        $modal.find('.emc-initonly').remove()
    })
}

/**
 * Builds the dialog.
 */
function buildDialog() {

    mapGuids()
    debugLog(settings)
    addMainTabs()
    addFields(settings.current, 'emcMainPanel')
    setInitialTab()
    initialBranchingLogic()
    finalize()
}

/**
 * Maps guids to settings and builds an object of values indexed by guids.
 * Also sets parents and siblings, and substitutes default tab for subsettings.
 * @param {ModuleSetting} setting 
 * @param {ModuleSetting} parent 
 * @param {Object<string, ModuleSetting>} siblings
 */
function mapGuids(setting = null, parent = null, siblings = null) {
    if (setting == null) {
        settings.values = {}
        Object.keys(settings.current).forEach(function(key) {
            /** @type {Object<string, ModuleSetting>} siblings */
            var siblings = {}
            Object.keys(settings.current).forEach(function(sibKey) {
                if (key != sibKey) {
                    siblings[sibKey] = settings.current[sibKey]
                }
            })
            var setting = settings.current[key]
            mapGuids(setting, null, siblings)
        })
    }
    else {
        setting.parent = parent
        setting.siblings = siblings
        if (parent != null && setting.config.tab == 'module-reserved-tab') {
            setting.config.tab = 'module-reserved-sub'
        }
        setting.guid = uuidv4()
        settings.values[setting.guid] = {
            guid: setting.guid,
            key: setting.config.key,
            value: setting.value,
            hidden: false,
            setting: setting
        }
        if (setting.hassubs) {
            mapSubGuids(setting)
        }
    }
}

/**
 * Maps guids to sub settings and builds an object of values indexed by guids.
 * Also sets parents and siblings, and substitutes default tab for subsettings.
 * @param {ModuleSetting} setting 
 * @param {any} instance
 */
function mapSubGuids(setting, instance = null) {
    Object.keys(setting.sub).forEach(function(ss_instance) {
        if (ss_instance == '') return
        if (instance !== null && instance != ss_instance ) return
        var subsetting = setting.sub[ss_instance]
        Object.keys(subsetting).forEach(function(key) {
            /** @type {Object<string, ModuleSetting>} siblings */
            var siblings = {}
            Object.keys(subsetting).forEach(function(sibKey) {
                if (key != sibKey) {
                    siblings[sibKey] = subsetting[sibKey]
                }
            })
            mapGuids(subsetting[key], setting, siblings)
        })
    })
}

/** 
 * Callback on success. 
 * @callback onSuccessCallback 
 */
/**
 * Callback on error.
 * @callback onErrorCallback
 * @param {string} errorMessage
 */
/**
 * Gets settings from server. When done, calls the callback.
 * @param {string} prefix
 * @param {string} guid
 * @param {onSuccessCallback} onSuccess 
 * @param {onErrorCallback} onError 
 */
function getSettings(prefix, guid, onSuccess, onError) {
    $.ajax({
        method: 'POST', 
        url: EM.emcAjax.get,
        data: 'verification=' + EM.emcAjax.verification + '&action=get-settings&prefix=' + prefix + '&guid=' + guid,
        dataType: "json",
        success: function(data) {
            $modal = $('#emcModal')
            if (data.success) {
                // Verify that response matches the current configuration.
                if (data.guid == $modal.attr('data-emc-guid')) {
                    debugLog(data)
                    EM.emcAjax.verification = data.verification
                    var json = JSON.stringify(data.settings)
                    settings.original = JSON.parse(json)
                    // @ts-ignore
                    settings.originalHash = objectHash(settings.original)
                    settings.current = JSON.parse(json)
                    settings.tabs = data.tabs
                    settings.guid = data.guid
                    onSuccess()
                }
                else {
                    debugLog('Late or unknown package arrived: ' + data.guid)
                }
            }
            else {
                onError(data.error)
            }
        },
        error: function(jqXHR, error) {
            debugLog('Ajax Error:', error, jqXHR)
            onError(error)
        }
    })
}

//#endregion

//#region Helpers ----------------------------------------------------------------

/**
 * Generates a version 4 unique identifier.
 * Used to guarantee the identity of objects / elements.
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

/**
 * Log to the console when in debug mode.
 */
function debugLog() {
    if (EM.emcDebug) {
        for (var i = 0; i < arguments.length; i++)
            console.log(arguments[i])
    }
}

//#endregion

//#region Save Settings ----------------------------------------------------------

// TODO - build a data structure that can be sent to the EM framework
// TODO - dirty tracking and visualization

//#endregion

//#region Export / Import --------------------------------------------------------

// TODO - implement

//#endregion

//#region Public -----------------------------------------------------------------

/**
 * Shows the enhanced module configuration dialog.
 * This is exposed in the globale ExternalModules object.
 */
EM.showEnhancedConfig = function (prefix, pid = null) {
    // Store arguments and get additional data.
    var guid = uuidv4()
    settings = {
        original: null,
        originalHash: null,
        current: null,
        tabs: null,
        guid: guid,
        updating: false,
        hideDuration: 0,
        showDuration: 200,
    }
    module = {
        prefix: prefix,
        version: EM.versionsByPrefixJSON[prefix],
        name: EM.configsByPrefixJSON[prefix].name,
        pid: pid,
        guid: guid
    }
    // Remove any previous modals.
    $('#emcModal').remove()
    // Clone the modal template.
    $modal = getTemplate('emcModal')
    $modal.attr('data-emc-guid', guid)
    $modal.attr('data-emc-prefix', prefix)
    debugLog('Created modal ' + guid)
    $('body').append($modal)
    // Setup the modal for the given module
    $modal.find('.emc-module-name').text(module.name)
    $modal.find('.emc-module-version').text(module.version)
    $modal.find('.modal-body').hide()
    $modal.find('.emc-initerror').hide()
    $modal.find('.emc-initializing').show()
    $modal.on('hidden.bs.modal', function () {
        // Destroy on closing. We always rebuild.
        debugLog('Destroyed modal ' + $modal.attr('data-emc-guid'))
        $modal.remove()
    })
    // Show the modal.
    $modal.modal('show')
    // Get settings and build.
    getSettings(prefix, guid, buildDialog, initError)
}

EM.addEnhancedConfigButtons = function(pid) {
    $('tr[data-module]').each(function() {
        const $this = $(this)
        const prefix = $this.attr('data-module')
        const version = $this.attr('data-version')
        const $btn = $('<button><i>Configure<b>+</b<</i></button>')
        $btn.on('click', function() {
            EM.showEnhancedConfig(prefix, pid)
        })
        $this.find('button.external-modules-configure-button').before($btn)
    })
}

//#endregion

})();