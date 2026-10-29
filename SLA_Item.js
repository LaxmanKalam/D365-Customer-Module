
var BSSCaseSlaItemLink = {

    syncMatchingSlaItem: async function (executionContext) {

        if (!executionContext ||
            typeof executionContext.getFormContext !== "function") {
            console.error("Pass execution context must be enabled.");
            return;
        }

        var formContext = executionContext.getFormContext();

        try {
            // 1. Get Case fields
            var customerAttr =
                formContext.getAttribute("bss_customerid");

            var firstResponseAttr =
                formContext.getAttribute("bss_firstresponseby");

            var resolveByAttr =
                formContext.getAttribute("bss_resolveby");

            // 2. Validate fields
            if (!customerAttr || !firstResponseAttr || !resolveByAttr) {
                console.error("Required Case fields are missing from the form.");
                return;
            }

            // 3. Get values
            var customer = customerAttr.getValue();
            var firstResponse = firstResponseAttr.getValue();
            var resolveBy = resolveByAttr.getValue();

            if (!customer || customer.length === 0 ||
                !firstResponse || !resolveBy) {
                console.warn("Customer or SLA deadline values are missing.");
                return;
            }

            // 4. Get saved Case ID
            var caseId = formContext.data.entity.getId();

            if (!caseId) {
                console.warn("Save the Case before syncing the SLA Item.");
                return;
            }

            caseId = caseId.replace(/[{}]/g, "");

            // 5. Prepare SLA Item values
            var customerName = customer[0].name;

            var slaItemData = {
                "bss_name": customerName,
                "bss_warnafter": firstResponse.toISOString(),
                "bss_failureafter": resolveBy.toISOString()
            };

            // 6. Create SLA Item
            var createdSlaItem = await Xrm.WebApi.createRecord(
                "bss_slaitem",
                slaItemData
            );

            // 7. Link SLA Item to Case
            await Xrm.WebApi.updateRecord(
                "bss_case",
                caseId,
                {
                    "bss_slaitem@odata.bind":
                        "/bss_slaitems(" +
                        createdSlaItem.id.replace(/[{}]/g, "") +
                        ")"
                }
            );

            // 8. Refresh Case form
            await formContext.data.refresh(false);

            console.log("SLA Item created and linked successfully.");

        } catch (error) {
            console.error("SLA Item Sync Error:", error.message || error);
        }
    }
};
