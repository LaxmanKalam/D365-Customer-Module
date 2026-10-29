
var BSSCaseSla = {
    setDeadlines: async function (executionContext) {
        var formContext = executionContext.getFormContext();

        try {
            var customerAttr =
                formContext.getAttribute("bss_customerid");

            var priorityAttr =
                formContext.getAttribute("bss_priority");

            var firstResponseAttr =
                formContext.getAttribute("bss_firstresponseby");

            var resolveByAttr =
                formContext.getAttribute("bss_resolveby");

            if (!customerAttr || !priorityAttr ||
                !firstResponseAttr || !resolveByAttr) {
                throw new Error(
                    "Check Case field logical names."
                );
            }

            var customer = customerAttr.getValue();
            var priority = priorityAttr.getText();

            if (!customer || !priority) {
                firstResponseAttr.setValue(null);
                resolveByAttr.setValue(null);
                return;
            }

            var customerId =
                customer[0].id.replace(/[{}]/g, "");

            var customerType = customer[0].entityType;

            if (customerType !== "bss_accounts") {
                throw new Error(
                    "Expected bss_accounts, but lookup returned: " +
                    customerType
                );
            }

            var account = await Xrm.WebApi.retrieveRecord(
                "bss_accounts",
                customerId,
                "?$select=bss_plan"
            );

            var plan = account.bss_plan;

            if (plan === null || plan === undefined) {
                throw new Error(
                    "Account Plan is empty. Select a plan on the Account."
                );
            }

            // Timings are in minutes:
            // [First Response, Resolution]

           var slaTimings = {
    "1-High":   [20, 180],
    "1-Medium": [45, 360],
    "1-Low":    [90, 720],
    "1-Normal": [45, 360],

    "2-High":   [45, 360],
    "2-Medium": [90, 540],
    "2-Low":    [180, 720],
    "2-Normal": [90, 540],

    "3-High":   [90, 360],
    "3-Medium": [180, 720],
    "3-Low":    [360, 1440],
    "3-Normal": [180, 720]
};
            var key = plan + "-" + priority;
            var timing = slaTimings[key];

            if (!timing) {
                throw new Error(
                    "No SLA timing found for Plan " +
                    plan + " and Priority " + priority +
                    ". Check the plan values and priority labels."
                );
            }

            var now = new Date();

            var firstResponseBy = new Date(
                now.getTime() + timing[0] * 60 * 1000
            );

            var resolveBy = new Date(
                now.getTime() + timing[1] * 60 * 1000
            );

            firstResponseAttr.setValue(firstResponseBy);
            resolveByAttr.setValue(resolveBy);

            firstResponseAttr.setSubmitMode("always");
            resolveByAttr.setSubmitMode("always");

        } catch (error) {
            console.error("Case SLA Timing Error:", error);

            await Xrm.Navigation.openAlertDialog({
                text:
                    "Unable to calculate Case SLA deadlines.\n" +
                    error.message
            });
        }
    }
};
