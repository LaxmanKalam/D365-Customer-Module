
var BSSCaseStatus = (function () {
    "use strict";

    function onStateChange(executionContext) {
        var formContext = executionContext.getFormContext();

        var stateAttr = formContext.getAttribute("statecode");
        var statusAttr = formContext.getAttribute("bss_status");
        var reasonAttr = formContext.getAttribute("bss_statusreason");

        if (!stateAttr || !statusAttr || !reasonAttr) {
            return;
        }

        // When State = Active (0)
        if (stateAttr.getValue() === 0) {
            statusAttr.setValue(1); // Active
            reasonAttr.setValue(1); // In Progress
        }
    }

    return {
        onStateChange: onStateChange
    };
})();
