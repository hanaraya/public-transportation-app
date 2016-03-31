var staticCahceName = 'transportation-static-v1';

self.addEventListener('install', function(event){
	event.waitUntil(
		caches.open(staticCahceName).then(function(cache){
			return cache.addAll([
				'/index.html',
				'js/main.js'
			]);
		})
		);
});

self.addEventListener('fetch', function(event){
	var requestUrl = new URL(event.request.url);
	if(requestUrl.origin === location.origin){
		if(requestUrl.pathname === '/'){
			event.respondWith(caches.match('/index.html'));
			return;
		}

		event.respondWith(caches.match(event.request));
	}

});