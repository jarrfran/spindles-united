/* Public Shopify Storefront API only. Never put an Admin/private token here. */
(function(root){
 'use strict';
 var endpoint='https://spindlesunited.store/api/2026-10/graphql.json';
 var money='amount currencyCode';
 var image='url altText width height';
 var summary='id handle title productType availableForSale featuredImage { '+image+' } images(first:2) { nodes { '+image+' } } priceRange { minVariantPrice { '+money+' } maxVariantPrice { '+money+' } }';
 var variant='id title availableForSale selectedOptions { name value } price { '+money+' } compareAtPrice { '+money+' } image { '+image+' }';
 var cartFields='id checkoutUrl totalQuantity cost { subtotalAmount { '+money+' } totalAmount { '+money+' } } lines(first:100) { nodes { id quantity cost { totalAmount { '+money+' } } merchandise { ... on ProductVariant { id title availableForSale image { '+image+' } selectedOptions { name value } price { '+money+' } product { handle title featuredImage { '+image+' } } } } } }';
 function client(request){
  request=request||root.fetch.bind(root);
  async function query(query,variables){
   var response=await request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify({query:query,variables:variables||{}})});
   if(!response.ok)throw new Error('The store could not connect. Please try again.');
   var result=await response.json();if(result.errors&&result.errors.length)throw new Error('The store is temporarily unavailable. Please try again.');
   if(!result.data)throw new Error('The store returned an incomplete response. Please try again.');return result.data;
  }
  function payload(data,key){var value=data[key];if(!value)throw new Error('Your cart could not be updated. Please try again.');if(value.userErrors&&value.userErrors.length)throw new Error(value.userErrors.map(function(e){return e.message;}).join(' '));if(!value.cart)throw new Error('This cart has expired. Please refresh and try again.');return {cart:value.cart,warnings:(value.warnings||[]).map(function(w){return w.message;}).join(' ')};}
  return {
   async products(){var all=[],after=null,page;do{var d=await query('query Catalogue($after:String){ products(first:30,after:$after,sortKey:BEST_SELLING) { nodes { '+summary+' } pageInfo { hasNextPage endCursor } } }',{after:after});page=d.products;all=all.concat(page.nodes);after=page.pageInfo.endCursor;}while(page.pageInfo.hasNextPage);return all;},
   async product(handle){var d=await query('query Product($handle:String!){ product(handle:$handle){ '+summary.replace('images(first:2) { nodes { '+image+' } }','')+' descriptionHtml options { name values } images(first:30){ nodes { '+image+' } } variants(first:100){ nodes { '+variant+' } pageInfo { hasNextPage endCursor } } } }',{handle:handle});var p=d.product;if(!p)return null;var page=p.variants;while(page.pageInfo.hasNextPage){var next=await query('query Variants($handle:String!,$after:String!){ product(handle:$handle){ variants(first:100,after:$after){ nodes { '+variant+' } pageInfo { hasNextPage endCursor } } } }',{handle:handle,after:page.pageInfo.endCursor});page=next.product.variants;p.variants.nodes=p.variants.nodes.concat(page.nodes);}return p;},
   async cart(id){return (await query('query Cart($id:ID!){ cart(id:$id){ '+cartFields+' } }',{id:id})).cart;},
   async add(id,merchandiseId,quantity){if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw new Error('Choose a quantity from 1 to 99.');var lines=[{merchandiseId:merchandiseId,quantity:quantity}];if(!id)return payload(await query('mutation Create($input:CartInput!){ cartCreate(input:$input){ cart { '+cartFields+' } userErrors { message } warnings { message } } }',{input:{lines:lines}}),'cartCreate');return payload(await query('mutation Add($id:ID!,$lines:[CartLineInput!]!){ cartLinesAdd(cartId:$id,lines:$lines){ cart { '+cartFields+' } userErrors { message } warnings { message } } }',{id:id,lines:lines}),'cartLinesAdd');},
   async quantity(id,lineId,quantity){if(!Number.isInteger(quantity)||quantity<0||quantity>99)throw new Error('Choose a quantity from 0 to 99.');if(quantity===0)return payload(await query('mutation Remove($id:ID!,$lines:[ID!]!){ cartLinesRemove(cartId:$id,lineIds:$lines){ cart { '+cartFields+' } userErrors { message } warnings { message } } }',{id:id,lines:[lineId]}),'cartLinesRemove');return payload(await query('mutation Update($id:ID!,$lines:[CartLineUpdateInput!]!){ cartLinesUpdate(cartId:$id,lines:$lines){ cart { '+cartFields+' } userErrors { message } warnings { message } } }',{id:id,lines:[{id:lineId,quantity:quantity}]}),'cartLinesUpdate');}
  };
 }
 function checkoutURL(value){try{var u=new URL(value);return u.protocol==='https:'&&(u.hostname==='spindlesunited.store'||u.hostname==='www.spindlesunited.store'||u.hostname.endsWith('.myshopify.com'))?u.href:null;}catch(e){return null;}}
 function category(p){if(/shirt|hoodie|sweat|tee/i.test(p.productType+' '+p.title))return 'Apparel';if(/hat|cap|beanie/i.test(p.productType+' '+p.title))return 'Headwear';if(/poster|print/i.test(p.productType+' '+p.title))return 'Posters';return 'Accessories';}
 var api={client:client,checkoutURL:checkoutURL,category:category};root.SUStoreAPI=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
