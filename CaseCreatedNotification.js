/*
 * caseNotification.js
 *
 * Register CaseNotification.showCaseCreatedNotification on the Case form's
 * PostSave event (not OnSave). Enable "Pass execution context as first parameter".
 *
 * This uses the supported Dataverse global notification API. It cannot render
 * custom HTML/CSS as a toast over the model-driven app shell. caseNotification.html
 * is a standalone design preview; a real custom app-shell toast needs a PCF/custom
 * page design that is integrated into the app.
 */
var CaseNotification = (function () {
    "use strict";

    function showCaseCreatedNotification(executionContext) {
        var eventArgs = executionContext.getEventArgs();

        // Do not show the message if the save failed.
        if (eventArgs && typeof eventArgs.getIsSaveSuccess === "function" &&
            !eventArgs.getIsSaveSuccess()) {
            return;
        }

        var formContext = executionContext.getFormContext();

        // PostSave can also run after updates. Only notify for a newly-created row.
        // Form type may change after a successful create, so check the save mode
        // isn't enough to distinguish create from update. Use the form's initial
        // type stored during OnLoad for a production implementation.
        if (window.__caseWasCreate !== true) {
            return;
        }

        Xrm.App.addGlobalNotification({
            type: 2, // Toast
            level: 1, // Success
            message: "New Case has been created successfully.",
            showCloseButton: true
        }).then(
            function (notificationId) {
                // Optional: retain ID if you later want to clear this notification.
                window.__lastCaseNotificationId = notificationId;
            },
            function (error) {
                console.error("Could not show Case notification: " + error.message);
            }
        );
    }

    function onLoad(executionContext) {
        var formContext = executionContext.getFormContext();
        window.__caseWasCreate = (formContext.ui.getFormType() === 1);
    }

    return {
        onLoad: onLoad,
        showCaseCreatedNotification: showCaseCreatedNotification
    };
})();
