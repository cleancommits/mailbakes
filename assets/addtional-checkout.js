{% if shop.metafields.adtr != blank %}
  {%- for field in shop.metafields.adtr -%}
    {% assign key = field | first %}
    {% assign value = field | last %}
    {% if key contains 'adtr.config' %}
      <script>
        window._adtrPixelDetails = '{{value}}';
      </script>
    {% endif %}
  {%- endfor -%}
{% endif %}
<script src="https://prod2-cdn.upstackified.com/scripts/px/adtr-shopify.min.js"></script>
<script>
  var adtOrderData = {
    customerId:
      window?.Shopify?.checkout?.customer_id ??
      '{{ order.customer_id || checkout.customer_id || order.customer.id || checkout.customer.id || order.checkout.customer.id}}',
    id: window?.Shopify?.checkout?.order_id ?? '{{ order_id || order.id }}',
    name: '{{ order_name || order.name }}',
    email: '{{ email || order.email }}',
    number: '{{ order_number || order.number }}',
    tags: '{% for line_item in line_items %} {% for tag in line_item.product.tags %}{{ tag}},{% endfor %}{% endfor %}',
    collections:
      '{% for line_item in line_items %}  {% for collection in line_item.product.collections %}{{ collection.id }},{% endfor %}{% endfor %}',
  };
  window._orderJson = JSON.stringify('{{order}}');
  window.adtOrderData = adtOrderData;  
  window._adqLoaded = 0;
  window._upsqueue = window._upsqueue || [];

  window.adq = function () {
    window._upsqueue.push(arguments);
  };
  window._upssqueue = window._upssqueue || [];
  window._upssClient = function () {
    window._upssqueue.push(arguments);
  };
  window._upssClient('init');

  // Prefill shipping address from line item properties
  document.addEventListener('DOMContentLoaded', function () {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        // Get the first line item's properties (assuming one product for simplicity)
        const properties = cart.items[0]?.properties || {};

        // Map line item properties to checkout form fields
        const fieldMappings = {
          'checkout_shipping_address_first_name': properties['Shipping First Name'],
          'checkout_shipping_address_last_name': properties['Shipping Last Name'],
          'checkout_shipping_address_address1': properties['Shipping Address Line 1'],
          'checkout_shipping_address_address2': properties['Shipping Address Line 2'],
          'checkout_shipping_address_city': properties['Shipping Town/City'],
          'checkout_shipping_address_zip': properties['Shipping Postcode'],
          'checkout_shipping_address_phone': properties['Shipping Phone Number']
        };

        // Populate form fields
        for (const [fieldId, value] of Object.entries(fieldMappings)) {
          const field = document.getElementById(fieldId);
          if (field && value) {
            field.value = value;
          }
        }
      })
      .catch(error => console.error('Error fetching cart data:', error));
  });
</script>