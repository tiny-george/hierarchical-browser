const getClient = (baseUrl, endpointName) => {
  return {
    baseUrl: baseUrl,
    endpointName: endpointName,
    getItems: function getItems(path) {
      return clientFunctions.makeCall(this.baseUrl + '/.rest/delivery/' + endpointName + path + '@nodes').then(function (data) {
        return JSON.parse(data);
      }).then((json) => {
        return json.map(jsonToItem);
      });
    }
  };
};

const jsonToItem = (data) => {
  var map = new Map(Object.entries(data)).set('isFolder', data['@nodeType'] === 'mgnl:folder');
  map['delete']('@nodes');
  map['delete']('@nodeType');
  return map;
};

const makeCall = (url) => {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.onload = () => {
      if (request.status === 200) {
        resolve(request.response);
      } else {
        reject(Error('Error making call to ' + url + '; error code:' + request.statusText));
      }
    };

    request.onerror = () => {
      reject(Error('There was a network error making call to ' + url));
    };

    request.send();
  });
};

const clientFunctions = {
  makeCall: makeCall,
  getClient: getClient
};

export default class HierarchicalBrowser extends HTMLElement {
    constructor() {
        super();
        this.baseUrl = this.getAttribute('baseUrl');
        this.endpoint = this.getAttribute('endpoint');
        const columns = this.getAttribute('columns');
        if (!columns) {
          this.columns = ["@path", "@name"];
        } else {
          this.columns = columns.split(","); 
        }
        this.shadow = this.attachShadow({mode: 'open'});
        this.client = getClient(this.baseUrl, this.endpoint);
        this.loadItems('/');
    }

    loadItems(path) {
      if (path != '/') {
        let parent = path.substring(0, path.length - 1);
        const lastSlash = parent.lastIndexOf('/');
        this.parent = lastSlash == 0 ? '/' : parent.substring(0, lastSlash);
      } else {
        this.parent = null;
      }
      this.path = path;
      this.state = 'loading';
      this.client.getItems(path).then(result => {
        this.items = result;
        this.state = 'ready';
      }).catch(error => {
        this.errorMessage = error.name + ": " + error.message;
        this.state = 'error';
      });
    }

    get state() {
        return this.getAttribute('state');
    }

    set state(value) {
        this.setAttribute('state', value);
    }

    static get observedAttributes() { return ['state']; }

    attributeChangedCallback(name, oldValue, newValue) {
      this.render();
   }

    connectedCallback() {
      this.render();
    }

    render() {
        this.shadow.innerHTML = '';
        if (this.getAttribute('state') == 'loading') {
            this.shadow.appendChild(this.loading());
        }
        if (this.getAttribute('state') == 'ready') {
          this.shadow.appendChild(this.showItems());
        }
        if (this.getAttribute('state') == 'error') {
            this.shadow.innerHTML = '<p class="error">' + this.errorMessage || 'Unknown Error' + '<p>';
        }
    }

    loading() {
        const template = document.getElementById('browser-loading');
        const instance = document.importNode(template.content, true);
        instance.querySelector('.endpoint-name').innerHTML = this.endpoint;
        return instance;
    }

    showItems() {
      const template = document.getElementById('browser-items');
      const instance = document.importNode(template.content, true);
      instance.querySelector('.items-path').innerHTML = this.path;
      instance.querySelector('.content-list').innerHTML = this.getItemsHtml();
      this.addFolderClickEvent(instance);
      return instance;
    }

    getItemsHtml() {
      if (this.items.size < 1) {
        return '<thead><tr><th>empty</th></tr></thead>';
      } else {
        let result = '';
        if (this.parent != null) {
          result += '<thead><tr><td class="folder" folder="' + this.parent + '">Go to ' + this.parent + '</td></tr></thead>';
        }
        result += this.getItemsHeader(this.columns) + this.getItemsBody(this.items, this.columns);
        return result;
      }
    }

    getItemsHeader(columns) {
      let headers = '';
      columns.forEach(column => headers += '<td>' + column + '</td>');
      return '<thead><tr>' + headers + '</tr></thead>';
    }

    getItemsBody(items, columns) {
      let rows = '';
      items.forEach(content => {
        let row = '<tr>';
        if (content.get('isFolder')) {
          row = '<tr class="folder" folder="' + content.get('@path') + '">'
        }
        columns.forEach(column => {
          const value = content.get(column);
          if (value == undefined) {
            row = row + '<td></td>';
          } else {
            row = row + '<td>' + content.get(column) + '</td>';
          }
        });
        row = row + '</tr>';
        rows = rows + row;
      });
      return '<tbody>' + rows + '</tbody>';     
    }

    addFolderClickEvent(instance) {
      if (instance.querySelector('.folder')) {
        const that = this;
        const elements = instance.querySelectorAll('.folder');
        elements.forEach(element => {
          element.addEventListener('click', (event) => {
            event.preventDefault();
            let row = event.target;
            while (row.getAttribute('folder') == undefined) {
              row = row.parentElement;
            }
            let path = row.getAttribute('folder');
            if (!path.endsWith('/')) {
              path = path + '/';
            }
            that.loadItems(path);
          });
        });
      }      
    } 
}

if (!customElements.get('hierarchical-browser')) {
    customElements.define('hierarchical-browser', HierarchicalBrowser);
}
