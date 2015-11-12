(function(window) {
    // The API developer key obtained from the Google Developers Console.
    var developerKey = 'AIzaSyCadYhB32DqY8fQ5ewkjZI5_kF1oUjEqmg';

    // The Client ID obtained from the Google Developers Console.
    var clientId = '650550464025-5adci434keh155qk5gr7pk220jfkq3cs.apps.googleusercontent.com';

    // Scope to use to access user's photos.
    var scope = ['https://www.googleapis.com/auth/drive.readonly'];

    var picker;
    var pickerApiLoaded = false;
    var authApiLoaded = false;
    var oauthToken;


    // Use the API Loader script to load google.picker and gapi.auth.
    function onApiLoad() {
        gapi.load('auth', {'callback': onAuthApiLoad});
        gapi.load('picker', {'callback': onPickerApiLoad});
    }

    function onAuthApiLoad() {
        authApiLoaded = true;
    }

    function onPickerApiLoad() {
        pickerApiLoaded = true;
    }

    function handleAuthResult(authResult) {
        if (authResult && !authResult.error) {
            oauthToken = authResult.access_token;
            showPicker();
        }
    }

    // Create and render a Picker object for picking user Photos.
    function createPicker() {
        if (pickerApiLoaded && oauthToken && !picker) {
            picker = new google.picker.PickerBuilder().
                addView(google.picker.ViewId.DOCS).
                setOAuthToken(oauthToken).
                setDeveloperKey(developerKey).
                setCallback(pickerCallback).
                build();
        }
    }

    // A simple callback implementation.
    function pickerCallback(data) {
        if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
            var doc = data[google.picker.Response.DOCUMENTS][0];
            req(doc['id']);
        }
    }

    // ファイルオブジェクト取得
    function req(id) {
        if (id) {
            var url = 'https://www.googleapis.com/drive/v2/files/' + id;
            var xhr = getXHR(url, function(res) {
                if (res && GP.onPicked) {
                    downloadFile(JSON.parse(res), GP.onPicked);
                }
            });

            xhr.setRequestHeader('Content-Type', 'text/plain');
            xhr.send();
        }
    }

    /**
     * Download a file's content.
     *
     * @param {File} file Drive File instance.
     * @param {Function} callback Function to call when the request is complete.
     */
    function downloadFile(file, callback) {
        if (file.downloadUrl) {
            var xhr = getXHR(file.downloadUrl, function(res) {
                callback(res);
            });
            xhr.send();
        } else {
            callback(null);
        }
    }

    // 認証トークン設定済みXMLHttpRequestオブジェクト作成
    function getXHR(url, callback) {
        var accessToken = gapi.auth.getToken().access_token;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function() {
            callback(xhr.responseText);
        };
        xhr.onerror = function() {
            callback(null);
        };
        return xhr;
    }

    function showPicker() {
        if (pickerApiLoaded) {
            createPicker();

            if (picker) {
                picker.setVisible(true);
            }
        }
    }


    // グローバルオブジェクトに登録
    window.GP = {
        showPicker: function() {
            if (!oauthToken && authApiLoaded) {
                // 未認証の場合は認証する
                window.gapi.auth.authorize({
                        'client_id': clientId,
                        'scope': scope,
                        'immediate': false
                    },
                    handleAuthResult);

            }else {
                showPicker();
            }
        },
        onPicked : function(txt) {}
    };
    window.onApiLoad = onApiLoad;
})(window);
