if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput = this.form.querySelector('[name=id]');
        this.variantIdInput.disabled = false;
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.shippingModal = document.querySelector('#ShippingModal');
        this.shippingForm = document.querySelector('#shipping-form');
        this.modalClose = document.querySelector('#ModalClose-Shipping');
        this.postcodeInput = document.querySelector('#shipping-postcode');
        this.postcodeError = document.querySelector('#postcode-error');

        if (this.cart) {
          this.submitButton.setAttribute('aria-haspopup', 'dialog');
        }

        this.hideErrors = this.dataset.hideErrors === 'true';

        // UK postcode regex validation
        this.ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;

        // Store address data in memory (session-based)
        this.savedAddress = null;

        // Initialize modal-related functionality
        this.initializeModal();
      }

      initializeModal() {
        // Debugging: Log missing elements
        if (!this.form) console.error('Product form not found');
        if (!this.submitButton) console.error('Add to Cart button not found');
        if (!this.shippingModal) console.error('Shipping modal not found');
        if (!this.shippingForm) console.error('Shipping form not found');

        // Load saved address from session if exists
        if (this.shippingForm && this.savedAddress) {
          Object.keys(this.savedAddress).forEach(key => {
            const input = this.shippingForm.querySelector(`#shipping-${key}`);
            if (input) input.value = this.savedAddress[key];
          });
        }

        // Validate postcode on input
        if (this.postcodeInput) {
          this.postcodeInput.addEventListener('input', () => {
            const postcode = this.postcodeInput.value.trim().toUpperCase();
            const isValid = this.ukPostcodeRegex.test(postcode);
            this.postcodeError.style.display = isValid || !postcode ? 'none' : 'block';
          });
        }

        // Handle shipping form submit
        if (this.shippingForm) {
          this.shippingForm.addEventListener('submit', this.onShippingFormSubmit.bind(this));
        }

        // Close modal
        if (this.modalClose) {
          this.modalClose.addEventListener('click', () => {
            this.shippingModal.classList.remove('active');
          });
        }

        // Close modal when clicking outside
        if (this.shippingModal) {
          this.shippingModal.addEventListener('click', (e) => {
            if (e.target === this.shippingModal) {
              this.shippingModal.classList.remove('active');
            }
          });
        }

        // Intercept submit button click to show modal
        if (this.submitButton) {
          // Clone button to remove existing listeners
          const newButton = this.submitButton.cloneNode(true);
          this.submitButton.parentNode.replaceChild(newButton, this.submitButton);
          this.submitButton = newButton;
          this.submitButton.addEventListener('click', this.onButtonClick.bind(this));
        }
      }

      onButtonClick(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        console.log('Add to Cart button clicked, opening modal');
        
        // Check if button is disabled
        if (this.submitButton.getAttribute('aria-disabled') === 'true' || 
            this.submitButton.hasAttribute('disabled')) {
          return;
        }

        if (this.shippingModal) {
          this.shippingModal.classList.add('active');
          // Focus on first input for accessibility
          const firstInput = this.shippingForm.querySelector('input[type="text"]');
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
          }
        } else {
          console.error('Shipping modal element not found');
        }
      }

      onShippingFormSubmit(evt) {
        evt.preventDefault();
        
        const postcode = this.postcodeInput.value.trim().toUpperCase();
        if (!this.ukPostcodeRegex.test(postcode)) {
          this.postcodeError.style.display = 'block';
          this.postcodeInput.focus();
          return;
        }

        // Hide postcode error if validation passes
        this.postcodeError.style.display = 'none';

        const formData = new FormData(this.shippingForm);
        const address = {};
        formData.forEach((value, key) => { 
          address[key.replace('shipping-', '')] = value.trim(); 
        });

        // Save address in memory for this session
        this.savedAddress = address;

        // Create a single string for the address
        const addressString = `${address.name}, ${address.address1}${address.address2 ? ', ' + address.address2 : ''}, ${address.city}, ${address.postcode}, ${address.country}`;

        // Add hidden input for line item property
        let lineItemInput = this.form.querySelector('input[name="properties[UK Shipping Address]"]');
        if (!lineItemInput) {
          lineItemInput = document.createElement('input');
          lineItemInput.type = 'hidden';
          lineItemInput.name = 'properties[UK Shipping Address]';
          this.form.appendChild(lineItemInput);
        }
        lineItemInput.value = addressString;

        // Close modal and trigger form submission
        this.shippingModal.classList.remove('active');
        this.onSubmitHandler();
      }

      onSubmitHandler() {
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner')?.classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error) {
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            }
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) {
              this.cart.classList.remove('is-empty');
            }
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner')?.classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}