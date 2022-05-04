<?php
/**
 * This is an AJAX endpoint that returns module settings.
 */

class emcGetSettingsAjax { static function process($m) {

    // Get payloads. REDCap adds CSRF tokens to $.ajax() - no idea how to verify them, so we just discard.
    $raw = file_get_contents("php://input");
    $data = array();
    foreach (explode("&", $raw) as $item) {
        $parts = explode("=", $item, 2);
        if (count($parts) == 2) {
            $data[$parts[0]] = $parts[1];
        }
    }

    // Default response.
    $response = array(
        "success" => false,
        "error" => "Invalid request."
    );

    // Check verification.
    $crypto = \DE\RUB\ConfigurationDialogExternalModule\Crypto::init();
    $verification = $crypto->decrypt($data["verification"]);
    $verified = $verification && $verification["pid"] == $GLOBALS["Proj"]->project_id && $verification["userid"] == $GLOBALS["userid"];
    if ($verified) {
        switch ($data["action"]) {
            case "get-settings":
                $response = $m->getSettingsAjax($data["prefix"], $data["guid"], $verification["pid"], $verification["type"]);
            break;
            default:
            break;

        }
        // Update timestamp.
        $verification["timestamp"] = time();
        $response["verification"] = $crypto->encrypt($verification);
    }
    // Send response.
    print json_encode($response);
}} 
emcGetSettingsAjax::process($module);
