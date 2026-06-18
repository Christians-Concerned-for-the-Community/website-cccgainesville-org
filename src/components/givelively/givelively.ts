{
  const MIN_DONATION = 5;
  const MAX_DONATION = 100000;
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // See if we need polyfill to mimic <dialog closedBy="any"> behavior on unsupported browsers.
  //  Note: Safari is only major one not ready yet - support is still in tech preview as of 2026/06
  const supports_closedby = (document.createElement("dialog") as any).closedBy === "none";

  document.querySelectorAll<HTMLFormElement>(".gl-simple-donation-widget").forEach((donateForm) => {
    const qs = (query: string) => donateForm.querySelector(query) as HTMLElement | null;

    const customInput = qs(".gl-amount > label input") as HTMLInputElement | null;
    const amountSet = qs(".gl-amount fieldset");
    const amountErr = qs(".gl-amount span[aria-live]");

    const donateSuffix = qs(".gl-donate-button span[aria-hidden]");
    const donateSuffixAlt = qs(".gl-donate-button span.sr-only");
    
    const dedButton = qs(".gl-ded-button");
    const dedModal = qs(".gl-ded-modal") as HTMLDialogElement | null;
    const dedForm = qs(".gl-ded-modal form") as HTMLFormElement | null;

    const dedNameInput = qs(".gl-ded-name input");
    const dedNameErr = qs(".gl-ded-name span[aria-live]");
    const dedEmailInput = qs(".gl-ded-email input");
    const dedEmailErr = qs(".gl-ded-email span[aria-live]");

    const donateModal = qs(".gl-donate-modal") as HTMLDialogElement | null;
    const iframe = qs(".gl-donate-modal iframe") as HTMLIFrameElement | null;

    if (!customInput || !amountErr || !donateSuffix || !donateSuffixAlt || !donateModal || !iframe) {
      return;
    }

    let dedData: Record<string, any> | undefined; // submitted data from Dedication modal will be passed in this var.

    const iframeUrl = new URL(`https://secure.givelively.org/donate/${donateForm.dataset.slug}`);
    const thisUrl = new URL(document.URL);

    const locale = donateForm.dataset.locale;
    const settings: Intl.NumberFormatOptions = {
      style: "currency",
      currency: donateForm.dataset.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };
    const currencyFormatter = Intl.NumberFormat(locale, settings);
    const currencyNameFormatter = Intl.NumberFormat(locale, {
      ...settings,
      currencyDisplay: "name"
    });

    // Helper utils.
    const updateError = (errDest: HTMLElement, culprit?: HTMLElement | null, msg?: string | null): boolean => {
      errDest.replaceChildren(...(msg? [msg] : []));
      if (culprit) {
        culprit.ariaInvalid = msg? "true" : null;
        culprit.ariaDescribedByElements = msg? [errDest] : null;
      }
      /* Returns true if there was an error message to add, false if the message was empty (everything OK). */
      return !!msg;
    }

    const updateDonateButton = (): void => {
      // Update donate button label based on currently selected amount and frequency.
      const formData = new FormData(donateForm);
      const [amountStr] = getAmountDigits(formData);

      const freq = (formData.get("frequency") === "monthly")? " Monthly" : "";

      donateSuffix.replaceChildren(...(
        amountStr? [currencyFormatter.format(amountStr as unknown as number) + freq] : []
      ));

      donateSuffixAlt.replaceChildren(...(
        amountStr? [currencyNameFormatter.format(amountStr as unknown as number) + freq] : []
      ));
    };

    const getAmountDigits = (formData: FormData): [string | null | undefined, boolean] => {
      const buttonSelection = formData.get("amount") as string | null;
      const customInput = formData.get("otherAmount") as string | null;
      const ret: [string | null | undefined, boolean] = (!amountSet || buttonSelection === "other")?
        [customInput, true] : [buttonSelection, false];
      ret[0] = ret[0]?.replace(/\D/g, "");
      return ret;
    };

    // Polyfill to mimic <dialog closedBy="any"> behavior on unsupported browsers.
    if (!supports_closedby) {
      [donateModal, dedModal].forEach(modal => modal?.addEventListener('click', (e) => {
        const edges = modal.getBoundingClientRect();
        if (e.clientX < edges.left || e.clientX > edges.right ||
            e.clientY < edges.top  || e.clientY > edges.bottom) {
          e.preventDefault();
          modal.close();
        }
      }));
    }

    // When any fields in the form are modified: update submit button text to reflect chosen donation amount
    donateForm.addEventListener('input', () => updateDonateButton());

    // When the amount button selection is changed:
    amountSet?.addEventListener("change", () => {
      // Clear all current amount errors.
      updateError(amountErr, amountSet);
      updateError(amountErr, customInput);
    });

    // When the custom amount is edited:
    customInput.addEventListener('input', () => {
      // Reformat number for current locale as currency, but remove the currency symbol (since it's already included in prefix).
      if (customInput.value) {
        const digits = customInput.value.replace(/\D/g, "");
        customInput.value = digits?
          currencyFormatter.formatToParts(digits as unknown as number)
            .flatMap((part) => part.type === "currency"? [] : [part.value]).join("").trim()
          :
          ""
        ;
      }
    });
    customInput.addEventListener('beforeinput', (e) => {
      // Prevent user from manually entering any non-digit characters.
      if (e.data && /\D/g.test(e.data)) {
        e.preventDefault();
      }
    });

    // When the iframe sends out a message:
    window.addEventListener('message', (e: MessageEvent) => {
      if (e.origin !== iframeUrl.origin) return; //make sure messages are coming from givelively's origin, for security

      const message = ((typeof e.data === "object")?
        (e.data?.message || JSON.stringify(e.data))
        :
        String(e.data)
      ).toLowerCase();

      // Reset the form if the user's donation succeeded.
      if (message.includes("gl_checkout_complete")) {
        donateForm.reset();
        updateDonateButton(); // needed because events aren't fired when form values are changed programmatically.
      }

      // Close the modal window if the user asked the iframe to close.
      if (message === "close_modal" && donateModal?.open) {
        donateModal.close();
      }
    });

    // When iframe is successfully loaded:
    iframe.addEventListener('load', () => {
      if (iframe.src && iframe.src !== "about:blank") {
        donateModal.toggleAttribute("data-loaded", true);
      }
    });

    // When donation modal is closed:
    donateModal.addEventListener("close", () => {
      // Clear out the iframe.
      iframe.setAttribute("src", "about:blank");
      donateModal.toggleAttribute("data-loaded", false);
    });

    // When dedication form is submitted:
    dedForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!dedButton || !dedNameErr || !dedEmailErr) {
        return;
      }

      // Get user selections.
      const formData = new FormData(dedForm);

      dedData = {
        type: (formData.get("ded_type") as string | null),
        name: (formData.get("ded_name") as string | null)?.trim(),
        email: (formData.get("ded_email") as string | null)?.trim()
      };

      // Validate user selections.
      if(
        updateError(dedNameErr, dedNameInput, dedData.name? "" :
          "Enter the dedicatee's name (John Smith)"
        )
        ||
        updateError(dedEmailErr, dedEmailInput, !dedData.email || EMAIL_REGEX.test(dedData.email)? "" :
          "Enter a valid email (jsmith@example.com)"
        )
      ) {
        dedButton.dataset.state = "new";
        dedData = undefined;
      } else {
        dedButton.dataset.state = "edit";
        dedModal?.close();
      }
    });

    // When donate form is submitted:
    donateForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get user selections from form.
      const donateFormData = new FormData(donateForm);

      const frequency = donateFormData.get("frequency") as string | null;

      const [amountStr, isCustom] = getAmountDigits(donateFormData);
      const amount = Number(amountStr) || 0;

      // Validate user selections.
      let errMsg;
      if (!isCustom && amount == 0) {
        errMsg = "Select a donation amount.";
      } else if (amount < MIN_DONATION) {
        errMsg = `Enter a donation of ${currencyFormatter.format(MIN_DONATION)} or more.`;
      } else if (amount > MAX_DONATION) {
        errMsg = `Enter a donation of ${currencyFormatter.format(MAX_DONATION)} or less.`;
      }
      if (updateError(amountErr, (isCustom? customInput : amountSet), errMsg)) { // clears err state if errMsg is falsy
        return;
      }

      // Construct query params to pass to the iframe.
      const params = new URLSearchParams({
        recurring: String(frequency === "monthly"),
        override_amount: amountStr || "",
        dedication_name: dedData?.name || "",
        dedication_email: dedData?.email || "",
        dedication_type: dedData?.type || "",
        widget_type: "simple_donation",
        widget_url: thisUrl.origin + thisUrl.pathname,
        isWixEmbedded: "false",
      });
      if (document.referrer) {
        params.set("referrer_url", document.referrer);
      }
      const utm_source = new URLSearchParams(thisUrl.search).get("utm_source");
      if (utm_source) {
        params.set("utm_source", utm_source);
      }

      // Set the iframe URL. Show modal window immediately.
      iframeUrl.search = params.toString();
      iframe.setAttribute("src", iframeUrl.toString());
      donateModal.showModal();
    });
  });
}