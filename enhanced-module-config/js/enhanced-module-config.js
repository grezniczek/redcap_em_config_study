// @ts-check
;(function() {
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


function debugLog() {
    if (EM.emcDebug) {
        for (var i = 0; i < arguments.length; i++)
            console.log(arguments[i])
    }
}

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
 * Adds the root-level fields.
 */
function addRootFields() {
    Object.keys(settings.current).forEach(function(key) {
        /** @type {ModuleSetting} Module setting info */
        var setting = settings.current[key]
        var id = 'emcSetting-' + key
        // Get outer template.
        var $f = getTemplate('emcSetting');
        // Add control template.
        var $control = getSettingTemplate(setting.config)
        $control.find('.emc-setting-labeltarget').attr('id', id)
        // Configure.
        $f.find('.emc-setting-field').append($control)
        $f.find('.emc-setting-label').attr('for', id)
        $f.find('.emc-setting-label-text').html(setting.config.name)
        if (setting.config['help-text'] || setting.config['help-url']) {
            $f.find('.emc-setting-help').attr('data-emc-setting-help', key)
        }
        else {
            $f.find('.emc-setting-help').remove()
        }
        $f.find('.emc-setting-description').html(setting.config.description)
        // Append to the correct tab.
        $('#emcMainPanel-' + setting.config.tab).append($f)
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
    var defaultName = 'emcMainTab-a' // 'emcMainTab-module-reserved-tab'
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
    $('.textarea-autosize').textareaAutoSize();
    // Hide blocking overlay and remove init-only items.
    $modal.find('.emc-default-body').show()
    $modal.find('.emc-loading').hide()
    $modal.find('.emc-overlay').fadeOut(300, function() {
        $modal.find('.emc-modal-wrapper').children().appendTo($modal.find('.modal-content'))
        $modal.find('.emc-initonly').remove()
    })
}

/**
 * Builds the dialog.
 */
function buildDialog() {

    addMainTabs()
    addRootFields()



    setInitialTab()
    finalize()
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
                insertPart($tpl, 'emcTextbox-repeatable')
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
                insertPart($tpl, 'emcTextarea-repeatable')
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
    var $target = $template.find('.' + $part.attr('data-emc-target'))
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