var REFRESH_TOKEN = null

self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
});
  
self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});


self.addEventListener( 'fetch', event => {
    var regex = /http:\/\/localhost:3000\/login/;
    if ( event.request.method == 'POST' && event.request.url.match( regex ) ) {
        var params = {}
        event.request.formData()
        .then (
            formData => {
                for(var pair of formData.entries()) {
                    params[ pair[0] ] = pair[ 1 ]
                }
                submitToken(params.username)
                .then(
                    tokens => {
                        REFRESH_TOKEN = tokens.refreshToken
                    }
                )
            }
        )
    } else {
        if ( REFRESH_TOKEN === null || REFRESH_TOKEN === undefined ) {
            event.respondWith (
                fetch( event.request )
                .then (
                    response => {
                        if ( !response.ok ) {
                            throw Error ( 'response status ' + response.status )
                        }
                        return response;
                    }
                )
                .catch (
                    error => {
                        return new Response (
                            null, 
                            {
                                status: 302,
                                statusText: 'Found',
                                headers: new Headers (
                                    {
                                        'location': '/login',
                                    }
                                )
                            }
                        )
                    }
                )
            )
        } else { 
            event.respondWith(
                fetchToken()
                .then ( 
                    accessToken => {
                        return fetch (
                            event.request.url, {
                                headers: {
                                    authorization: "Bearer " + accessToken,
                                }
                            }
                        )
                    }
                )
            )
        }
    }
})

// functions

async function fetchToken() {
    var accessToken = null
    var response = await fetch ( "http://localhost:3000/auth/token", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( { "token": REFRESH_TOKEN } )
    })
    if ( response.status===200 ) {
        let data =  await response.json()
        accessToken = data.accessToken
    }
    return accessToken
}

async function submitToken ( user ) {
    var accessToken = null
    var response = await fetch ( "http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( { "username": user } )
    })
    if ( response.status===200 ) {
        let data = await response.json()
        accessToken = data.accessToken
        refreshToken = data.refreshToken
    }
    return { accessToken: accessToken, refreshToken: refreshToken } 
}
