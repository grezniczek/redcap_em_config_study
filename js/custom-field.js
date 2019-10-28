CustomField = {}
CustomField.initialize = function() {
    console.log(arguments);
    var f = arguments[0]
    $(f).val("Hi from the CustomField JavaScript object's initialize function!")
}