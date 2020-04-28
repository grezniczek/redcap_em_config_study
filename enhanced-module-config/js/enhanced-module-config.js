// @ts-check
;(function() {

//#region Init & "global" variables ----------------------------------------------

// @ts-ignore
if (typeof window.ExternalModules == 'undefined') {
    /** @type {ExternalModules} */
    var EM = {}
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
            applyBranchingLogic(setting)
        })
    }
    else {
        applyBranchingLogic(setting);
        // Process nested - only when not hidden.
        if (!settings.values[setting.guid].hidden && setting.hassubs) {
            setting.sub.forEach(function(subsetting) {
                Object.keys(subsetting).forEach(function(key) {
                    applyBranchingLogic(subsetting[key])
                })
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
        setting.sub.forEach(function(subsettings) {
            Object.keys(subsettings).forEach(function(subKey) {
                var subsetting = subsettings[subKey]
                processDependingBranching(subsetting, key)
            })
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

//#region Build Settings ---------------------------------------------------------

/**
 * Updates values and initiates branching logic processing.
 * @param {JQuery} $field 
 * @param {ModuleSetting} setting 
 * @param {number} instance 
 */
function valueChanged($field, setting, instance) {
    var value = []
    $field.find('.emc-value').each(function() {
        value.push(getControlValue(setting, $(this)))
    })
    if (!setting.repeats) {
        value = value[0]
    }
    // Store value in guid lookup.
    settings.values[setting.guid].value = value
    // Process branching logic for self and siblings.
    if (setting.dependencies.depending.length) {
        processDependingBranching(setting, setting.config.key)
        Object.keys(setting.siblings).forEach(function(sibKey) {
            var sibSetting = setting.siblings[sibKey]
            processDependingBranching(sibSetting, setting.config.key)
        })
    }
}

/**
 * Sets the value of a control.
 * @param {ModuleSetting} setting 
 * @param {JQuery} $value 
 * @param {any} value 
 */
function setControlValue(setting, $value, value) {
    switch(setting.type) {
        case 'checkbox': {
            $value.prop('checked', value == true)
        }

        default: {
            $value.val(value)
        }
    }
}

/**
 * Gets the value of a control.
 * @param {ModuleSetting} setting 
 * @param {JQuery} $value 
 */
function getControlValue(setting, $value) {
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
 * Builds a field.
 * @param {ModuleSetting} setting
 * @param {string} key
 * @param {number} instance
 * @returns {JQuery}
 */
function buildField(setting, key, instance = 0) {
    var baseId = 'emcSetting-' + key
    // Get outer template.
    var $f = getTemplate('emcSetting');
    // Configure label part.
    $f.find('.emc-setting-label-text').html(setting.config.name)
    if (setting.config['help-text'] || setting.config['help-url']) {
        $f.find('.emc-setting-help').attr('data-emc-setting-help', key)
    }
    else {
        $f.find('.emc-setting-help').remove()
    }
    $f.find('.emc-setting-description').html(setting.config.description)
    // Add field and instance.
    $f.attr('data-emc-field', key)
    $f.attr('data-emc-guid', setting.guid)
    $f.attr('data-emc-instance', instance)
    // Minimum 1, maximum 1 for type 'sub_setting'
    var count = setting.hassubs ? 0 : parseInt(setting.count)
    var n = (setting.type == 'sub_setting') ? 1 : Math.max(1, count)
    var $sf = $f.find('.emc-setting-field')
    // Add control template(s).
    if (setting.type == 'sub_settings' && !setting.repeats) {
        // Non-repeating subsettings - recurse buildField
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
        // "Regular" (repeating) control.
        for (var i = 0; i < n; i++) {
            var id = baseId + '-' + uuidv4()
            var $control = getSettingTemplate(setting.config)
            $control.find('.emc-setting-labeltarget').attr('id', id)
            // Placeholder.
            $control.find('input[type="text"]').attr('placeholder', setting.config.placeholder)
            // Set value.
            var $value = $control.find('.emc-value')
            var value = setting.repeats ?
                (count == 0 ? "" : setting.value[i]) : setting.value
            setControlValue(setting, $value, value)
            // Hook up events.
            $value.on('change', function() {
                valueChanged($f, setting, instance)
            })
            // Append to parent.
            $sf.append($control)
        }
        // Marry up label with control.
        var id = $f.find('.emc-setting-labeltarget').first().attr('id')
        $sf.find('[aria-labelled-by]').attr('aria-labelled-by', id)
        $f.find('.emc-setting-label').attr('for', id)
    }
    // Add "add more" stub.
    if (setting.type != 'sub_setting' && setting.repeats) {
        insertPart($f, 'emcAddInstance')
    }
    return $f
}

/**
 * Adds the root-level fields.
 */
function addRootFields() {
    Object.keys(settings.current).forEach(function(key) {
        /** @type {ModuleSetting} Module setting info */
        var setting = settings.current[key]

        var $field = buildField(setting, key)

        // Append to the correct tab.
        $('#emcMainPanel-' + setting.config.tab).append($field)
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

//#endregion (Build Settings)

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
            $a.attr('aria-controls', '#emcMainPanel-' + tabKey)
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
    addRootFields()
    setInitialTab()
    initialBranchingLogic()
    finalize()
}

/**
 * Maps guids to settings and builds an object of values indexed by guids.
 * Also sets parents and siblings.
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
        setting.guid = uuidv4()
        settings.values[setting.guid] = {
            guid: setting.guid,
            key: setting.config.key,
            value: setting.value,
            hidden: false,
            setting: setting
        }
        if (setting.hassubs) {
            setting.sub.forEach(function(subsetting) {
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
    }
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
        guid: guid
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

//#endregion


// TODO: Remove - this is for development only!
$(function() {
    if (EM.PID) {
        EM.showEnhancedConfig('global_piping', 40)
    }
    else {
        EM.showEnhancedConfig('redcap_em_config_study', null)
    }
})
})();