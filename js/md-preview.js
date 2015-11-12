(function(window, document){
    var
    PADDING_Y = 40, // paddintTop + paddingBottom
    MOVETO_MARGIN = 15;
    
    var body = document.body;

    /**
     * Helper (from marked.js)
     */
    function escape(html, encode) {
        return html
            .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    /*
     *  marked.js customize 
     */
    var renderer = new marked.Renderer();

    renderer.code = function(code, lang) {
        if (!lang) {
            return '<pre>'
                + escape(code, true)
                + '\n</pre>';
        }

        return '<pre class="'
            + 'brush:'
            + lang
            + '">'
            + escape(code)
            + '\n</pre>\n';
    };
    

    /*
     *  SyntaxHighlighter setting
     */
    var path = function() {
        var
        args = arguments,
        result = [];
            
        for(var i = 0; i < args.length; i++) {
            result.push(args[i].replace('@', 'js/brushes/'));
        }
        return result;
    },

    syntaxHighlight = function() {
        SyntaxHighlighter.autoloader.apply(null, path(
            'applescript			@shBrushAppleScript.js',
            'actionscript3 as3		@shBrushAS3.js',
            'bash shell				@shBrushBash.js',
            'coldfusion cf			@shBrushColdFusion.js',
            'cpp c					@shBrushCpp.js',
            'c# c-sharp csharp		@shBrushCSharp.js',
            'css					@shBrushCss.js',
            'delphi pascal			@shBrushDelphi.js',
            'diff patch pas			@shBrushDiff.js',
            'erl erlang				@shBrushErlang.js',
            'groovy					@shBrushGroovy.js',
            'java					@shBrushJava.js',
            'jfx javafx				@shBrushJavaFX.js',
            'js jscript javascript	@shBrushJScript.js',
            'objc obj-c objective-c @shBrushObjectiveC.js',
            'perl pl				@shBrushPerl.js',
            'php					@shBrushPhp.js',
            'text plain				@shBrushPlain.js',
            'py python				@shBrushPython.js',
            'powershell ps posh		@shBrushPowerShell.js',
            'ruby rails ror rb		@shBrushRuby.js',
            'sass scss				@shBrushSass.js',
            'scala					@shBrushScala.js',
            'sql					@shBrushSql.js',
            'swift					@shBrushSwift.js',
            'vb vbnet				@shBrushVb.js'
        ));
        
        // reset brushes
        SyntaxHighlighter.vars.discoveredBrushes = null;

        SyntaxHighlighter.all({
            toolbar: false
        });
    };


    /*
     *  customize element prototype
     */
    if (Element.prototype.innerText) {
        Element.prototype.getText = function() {
            return this.innerText;
        };
        Element.prototype.setText = function(txt) {
            this.innerText = txt;
        };
    }else {
        Element.prototype.getText = function() {
            return this.textContent;
        };
        Element.prototype.setText = function(txt) {
            this.textContent = txt;
        };
    }

    
    /*
     *  Objects
     */
    var handleContainerScroll;
    var contents = {
        element: document.getElementById('contents'),
        containerElement: document.getElementById('container'),
        hList: [],
        render: function(txt) {
            this.element.innerHTML = marked(txt, {renderer: renderer});
            this.hList = contents.element.querySelectorAll('h1,h2,h3,h4,h5,h6');
            this.setAnchorTarget();
            this.setPageTitle();
            syntaxHighlight();
        },
        
        computeCurrentIndex: function() {
            var
            posY = this.containerElement.scrollTop,
            hs = this.hList
            hsLength = hs.length;
            
            if (hs[0] && posY < hs[0].offsetTop) {
                return 0;
            }else if (hsLength> 0 && posY + MOVETO_MARGIN >= hs[hsLength- 1].offsetTop) {
                return hsLength- 1;
            } 

            for (var i=0; i<hsLength; ++i) {
                if (hs[i].offsetTop > (posY + MOVETO_MARGIN)) {
                    return i - 1;
                }
            }
            return 0;
        },

        moveTo: function(index) {
            var
            h = this.hList[index]
            containerElement = this.containerElement;


            containerElement.removeEventListener('scroll', handleContainerScroll, false);

            if (index === 0) {
                containerElement.scrollTop = 0;
            }else {
                containerElement.scrollTop = h.offsetTop - MOVETO_MARGIN;
            }

            setTimeout(function() {
                containerElement.addEventListener('scroll', handleContainerScroll, false);
            }, 0);
        },

        resize: function(bodyHeight) {
            this.containerElement.style.height = bodyHeight - PADDING_Y;
        },

        setAnchorTarget: function() {
            var
            anchors = this.element.querySelectorAll('a'),
            a;
            
            for (var i=0, len=anchors.length; i<len; ++i) {
                a = anchors[i];
                if (!/^#.+/.test(a.getAttribute('href'))) {
                    a.setAttribute('target', '_blank');
                }
            }
        },

        setPageTitle: function() {
            var
            h1 = document.querySelector('h1'),
            title = 'Markdown Preview';

            if (h1) {
                title = h1.getText();
            }
            
            document.querySelector('title').setText(title);
        }
    };

    var navigation = {
        element: document.getElementById('navigation'),
        listElement: document.getElementById('navlist'),
        liList: [],
        currentIndex: 0,
        reset: function() {
            var
            docFrag = document.createDocumentFragment(),
            list = this.listElement,
            hList = contents.hList,
            index;
            
            this.liList = [];

            for (var i=0, len=hList.length; i<len; ++i) {
                var
                h = hList[i],
                li = document.createElement('li');

                li.setText(h.getText());
                li.className = h.tagName.toLowerCase();
                li.setAttribute('data-nav-index', i);

                docFrag.appendChild(li);

                this.liList.push(li);
            }
            
            this.listElement.innerHTML = '';
            this.listElement.appendChild(docFrag);

            index = contents.computeCurrentIndex();

            this.moveTo(index);
        },

        resize: function(bodyHeight) {
            this.element.style.height = bodyHeight - PADDING_Y;
        },

        show: function() {
            if (this.liList.length === 0) {
                return;
            }
            body.className = 'nav-show';
        },

        hide: function() {
            body.className = 'nav-hide';
        },

        highlight: function(index) {
            var
            currentLi = this.listElement.querySelector('.highlight'),
            newLi = this.liList[index];
            
            if (currentLi) {
                currentLi.classList.remove('highlight');
            }
            if (newLi) {
                newLi.classList.add('highlight');
            }
        },

        adjustScroll: function() {
            var
            nav = this.element,    
            curLi = this.liList[this.currentIndex],
            targetLi;

            if (nav.scrollHeight <= nav.offsetHeight) {
                return;
            }

            if (curLi.offsetTop > (nav.scrollTop + nav.clientHeight * 0.8)) {
                targetLi = this.liList[this.currentIndex + 1];

                if (targetLi) {
                    nav.scrollTop += targetLi.offsetHeight;
                }
            }else if (curLi.offsetTop <= (nav.scrollTop + nav.clientHeight * 0.1)) {
                targetLi = this.liList[this.currentIndex - 1];
                
                if (targetLi) {
                    nav.scrollTop -= targetLi.offsetHeight;
                }
            }
        },
        
        moveTo: function(index) {
            this.currentIndex = index;
            this.highlight(index);
            this.adjustScroll();
        },

        next: function() {
            var index = this.currentIndex + 1;
            
            if (this.currentIndex < this.liList.length - 1) {
                this.moveTo(index);
                contents.moveTo(index);
            }
        },

        prev: function() {
            var index = this.currentIndex - 1;

            if (this.currentIndex > 0) {
                this.moveTo(index);
                contents.moveTo(index);
            }
        }
    };


    var file = {
        o: null,
        reader  : null,
        timer   : null,
        lastModifiedDate: null,
        readFile: function(file) {
            var
            rd = this.reader,
            lastModified = file.lastModifiedDate.toLocaleString();

            if (!rd) {
                rd = new FileReader();
                
                rd.onload = function(e) {
                    var index;
                    contents.render(e.target.result);
                    navigation.reset();
                };

                this.reader = rd;
            }

            if (lastModified != this.lastModifiedDate) {
                this.lastModifiedDate = lastModified;
                rd.readAsText(file);
            }
        },
        startObserve: function() {
            var self = this;

            this.timer = setInterval(function() {
                self.readFile(self.o);
            }, 250);
        },
        handleFiles: function(files) {
            if (files.length === 0) {
                return;
            }

            this.o = files[0];
            
            this.readFile(this.o);

            if (this.timer) {
                clearInterval(this.timer);
            }
            this.startObserve();
        }
    };

    /*
     *  window resize event
     */
    var resize = function() {
        var bodyHeight = body.clientHeight;

        contents.resize(bodyHeight);
        navigation.resize(bodyHeight);
    };

    window.addEventListener('resize', function() {
        resize();
    }, false);

    resize();


    /*
     *  scroll event
     */
    handleContainerScroll = function() {
        var index = contents.computeCurrentIndex();

        navigation.moveTo(index);
    };

    contents.containerElement.addEventListener('scroll', handleContainerScroll, false);


    /*
     *  Drag and drop event 
     */
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    }, false);

    document.addEventListener('dragend', function(e) {
        this.className = '';
    }, false);

    document.addEventListener('drop', function(e) {
        e.preventDefault();
        file.handleFiles(e.dataTransfer.files);
    }, false);


    /*
     *  Navigation click event
     */
    navigation.element.addEventListener('click', function(e) {
        var
        target = e.target,
        navigationElement = navigation.element;

        while (target.tagName !== 'LI' && target !== navigationElement) {
            target = target.parentNode;
        }

        if (target.tagName === 'LI') {
            var index = parseInt(target.getAttribute('data-nav-index'), 10);

            contents.moveTo(index);
            navigation.moveTo(index);
        }
    }, false);


    /*
     *  Key event
     */
    document.addEventListener("keydown", function(e) {
        switch (e.keyCode){
            case 37: //←
                navigation.hide();
                e.preventDefault();
                break;
            case 38: //↑
                navigation.prev();
                e.preventDefault();
                break;
            case 39: //→
                navigation.show();
                e.preventDefault();
                break;
            case 40: //↓
                navigation.next();
                e.preventDefault();
                break;
            case 80: // p
                contents.element.classList.toggle('presen-mode');
                break;

        }
    }, false);


    /*
     *  load initial file
     */
    var
    fileName = window.location.hash,
    xhr;

    if (fileName) {
        xhr = new XMLHttpRequest();
        
        fileName = fileName.replace(/^#/, '');

        xhr.onreadystatechange = function() {
            var
            READYSTATE_COMPLETED = 4,
            HTTP_STATUS_OK = 200;

            if (this.readyState == READYSTATE_COMPLETED
                && this.status == HTTP_STATUS_OK)
            {
                contents.render(this.responseText);
                navigation.reset();
            }
        };

        xhr.open('GET', fileName);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.send();
    }
    // グローバルオブジェクト登録
    window.MDPreview = {
        renderTxt: function(txt) {
            contents.render(txt);
            navigation.reset();
        }
    }
})(window, document);
