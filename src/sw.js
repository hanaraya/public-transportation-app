var staticCahceName = 'transportation-static-v1';
//
self.addEventListener('install', function(event){
	event.waitUntil(
		caches.open(staticCahceName).then(function(cache){
			return cache.addAll([
				'/index.html',
				'js/main.js',
				'css/styles.css'
			]);
		})
		);
});

self.addEventListener('fetch', function(event){
	console.log('SW fetching');
	var requestUrl = new URL(event.request.url);
	console.log('req origin : ', requestUrl.origin);
	console.log('loc origin : ', location.origin);
	if(requestUrl.origin === location.origin){
		if(requestUrl.pathname === '/'){
			event.respondWith(caches.match('/index.html'));
			return;
		}

		event.respondWith(caches.match(event.request));
	}

});