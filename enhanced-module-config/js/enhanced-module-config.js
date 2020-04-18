// @ts-check
;(function() {
// @ts-ignore
if (typeof window.ExternalModules == 'undefined') {
    /** @type {ExternalModules} */
    var EM = {}
    // @ts-ignore
    window.ExternalModules = EM
}
// Shows the enhanced module configuration dialog.
EM.showEnhancedConfig = function (prefix, pid = null) {
    // Setup the modal for the given module
    var name = EM.configsByPrefixJSON[prefix].name
    $('span.emc-module-name').text(name)
    



    // TODO

    // Show the modal.
    $('#emcModal').modal('show')
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