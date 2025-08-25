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
</script>
