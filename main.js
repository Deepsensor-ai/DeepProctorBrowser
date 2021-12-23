const { app, BrowserWindow, globalShortcut, Menu, ipcMain,screen, shell, dialog, net } = require('electron')
const Main = require('electron/main');
var encodeUrl = require('encodeurl')

 //handle setupevents as quickly as possible
const setupEvents = require('./installer/setupEvents')

if (setupEvents.handleSquirrelEvent()) {
// squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}


// Set env
process.env.NODE_ENV = 'production'

const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false
const API_URL = "https://j2yd3pb5ha.execute-api.us-east-1.amazonaws.com/default/isValidUrl?examUrl="


let mainWindow
let examWindow
let displayList
let violationCount = 0


function createMainWindow() {

    displayList = screen.getAllDisplays();

    console.log(`${displayList.length}`)

    displayList.forEach(element => {
        console.log(`Width - ${element.workArea.width} - Heiight - ${element.workArea.height}`)
    });
    
    mainWindow = new BrowserWindow(
        {
            title : ' DeepProctor Exam Browser',
            width : displayList[0].workArea.width/2,
            height : displayList[0].workArea.height/2,
            icon: `${__dirname}/assets/icons/Icon_256x256.png`,
            webPreferences: {
                nodeIntegration : true,
                contextIsolation: false
            },
            kiosk:false,
            
        }

    )

     //mainWindow.webContents.toggleDevTools();

    mainWindow.loadFile(`./app/index.html`)
    //mainWindow.loadURL(`http://localhost/deb/app/index.html`)

    

    //mainWindow.webContents.send('user:valid', displayList.length)

    mainWindow.on('focus', () => {
        // Do your required stuff, when the window is focused
        console.log('focus');
    }); 

}

function httpGet(theUrl, o) {

    let ret
    console.log(`From httpGet ${theUrl}`);
    const request = net.request(theUrl)
    request.on('response', (response) => {
        console.log(`STATUS: ${response.statusCode}`)
        console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
            response.on('data', (chunk) => {
                //console.log(`BODY: ${chunk}`)
                ret = chunk
                console.log(`Body ${ret}`);

                console.log('sening data');
                    retMessage = ""
                    console.log("I'm here..");
                    if(chunk != "1"){
                        retMessage = "This url is not registered with DeepProctor"
                    }
                    if(retMessage == ""){
                        console.log(`$ The message is :${retMessage}, the url is ${o.url}`);
                        mainWindow.loadURL(o.url)
                        mainWindow.kiosk = true
                        mainWindow.modal = true
                        mainWindow.minimizable= false,
                        mainWindow.maximizable= false,
                        mainWindow.alwaysOnTop= true,
                        mainWindow.frame= false,
                        mainWindow.movable= false,
                        mainWindow.skipTaskbar= true,
                        mainWindow.autoHideMenuBar= true,
                        mainWindow.on('blur', () => {
                            // Do your required stuff, when the window loose the focus
                            showQuitMessage()
                            // console.log('lost focus');
                            // mainWindow.restore();
                            // mainWindow.focus();
                            // mainWindow.setKiosk(true);
                            //app.quit()
                        });
                
                    }else {
                        mainWindow.webContents.send('user:valid', retMessage)
                }
            })
        response.on('end', () => {
        console.log('No more data in response.')
        })
    })
    request.end()

    return ret
}

function showQuitMessage(){

    violationCount++
    const options = {
        buttons: ['Ok'],
        defaultId: 2,
        title: 'Exam Violation - Warning',
        message: (violationCount > 0)?'System detected you were trying to navigate away from the exam. Your exam is being terminated' : 'Your exam is being terminated immediately'
    };
    
    if(false){
        const response = dialog.showMessageBox(mainWindow, options, null);
        response.then(() => {
            console.log('trying to refocus');
            mainWindow.restore()
            mainWindow.focus();
            mainWindow.setKiosk(true);
        })
        //mainWindow.restore();
        
        console.log(`res - ${response}`);
    }
    else{
        const response = dialog.showMessageBox(mainWindow, options, null);
        response.then(()=>app.quit(), ()=>app.quit())
        console.log(`res - ${response}`);
    }
    
}

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
    title: 'Simple Calculator',
    width: 400,
    height: 300,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: false,
    backgroundColor: 'white',
    })

    aboutWindow.loadFile('./app/about.html')
}

function createCalcWindow() {
    aboutWindow = new BrowserWindow({
    title: 'Simple Calculator',
    width: 400,
    height: 600,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: false,
    backgroundColor: 'white',
    })

    aboutWindow.loadFile('./app/calc.html')
}

//.................................subscribed events....................................................
ipcMain.on('url:open', (e,o) => {
    console.log(`Messaeg ${o}`)

    retMessage = "";

    //check if only 1 monitor is connected
    if(displayList.length > 1){
        retMessage = "Multiple monitors detected. You can only have 1 monitor connected in order to start the exam."
    }

    let urlToOpen = o.url.toString();
    let apiUrl = `${API_URL}${encodeUrl(urlToOpen)}`
    httpGet(apiUrl, o)
    
})

    


const menu =[ 
                {
                    role:'fileMenu'
                }
            ]

// const menu = [
//         ...(isMac
//         ? [
//             {
//                 label: app.name,
//                 submenu: [
//                 {
//                     label: 'Calculator',
//                     click: createCalcWindow,
//                 },
//                 ],
//             },
//             ]
//         : []),
//         {
//         role: 'fileMenu',
//         },
//         ...(!isMac
//         ? [
//             {
//                 label: 'Tools',
//                 submenu: [
//                 {
//                     label: 'Calculator',
//                     click: createCalcWindow,
//                 },
//                 ],
//             },
//             ]
//         : []),
//         ...(isDev
//         ? [
//             {
//                 label: 'Developer',
//                 submenu: [
//                 { role: 'reload' },
//                 { role: 'forcereload' },
//                 { type: 'separator' },
//                 { role: 'toggledevtools' },
//                 ],
//             },
//             ]
//         : []),
//     ]

// app.on('ready', () => {
//     createMainWindow()
//     mainWindow.on('ready', () => (mainWindow = null))
// })


app.on('ready', () => {
    createMainWindow()

    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    mainWindow.on('ready', () => (mainWindow = null))

    globalShortcut.register('Super+Space', () => {
        // Do stuff when Y and either Command/Control is pressed.
        console.log('Cmd+Y');
    })
})

app.on('window-all-closed', () => {
    if (!isMac) {
    app.quit()
    }
})


app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})

app.allowRendererProcessReuse = true