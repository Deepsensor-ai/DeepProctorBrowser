const { app, BrowserWindow, globalShortcut, Menu, ipcMain, screen, shell, dialog, net } = require('electron')
const Main = require('electron/main');
const { autoUpdater } = require('electron-updater');

var _ = require('lodash');
var ps = require('current-processes');

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
let isCalcInFocus = false
let appsFound = []

function getMonitorCount(){
    displayList = screen.getAllDisplays();

    console.log(`${displayList.length}`)

    displayList.forEach(element => {
        console.log(`Width - ${element.workArea.width} - Heiight - ${element.workArea.height}`)
    });

    return displayList;
}

function getProcessList(){
    console.log("Printing process list..")

    appsFound = []

    ps.get(function(err, processes) {
        
        var illegalAppMap = new Map()
            illegalAppMap.set('outlook', ' MS Outlook')
            illegalAppMap.set('winword',' MS Word')
            illegalAppMap.set('msteams',' Teams')
            illegalAppMap.set('msedge',' MS Edge Browser')
            illegalAppMap.set('zoom',' Zoom')
            illegalAppMap.set('mstsc',' MS Teams Chat')
            illegalAppMap.set('powerpnt',' MS Power Point')
            illegalAppMap.set('excel',' MS Excel')
            illegalAppMap.set('snagit32',' SnagIT - TechSmith')
            illegalAppMap.set('screensketch',' Screen Capture')
            illegalAppMap.set('notepad',' NotePad')
            illegalAppMap.set('chrome',' Chrome Browser')
            illegalAppMap.set('slack',' Slack')
            illegalAppMap.set('facebook',' Facebook')
            illegalAppMap.set('skype',' Skype')
            illegalAppMap.set('firefox',' FireFox')
            illegalAppMap.set('iexplore',' Internet Explorer')

        if(processes == undefined){
            console.log("Process is undefined..");
            return
        } 

        processes.forEach( o => {
            let found = illegalAppMap.get(o.name.toLowerCase())
            if(found != undefined){
                if(! appsFound.includes(found)){
                    appsFound.push(found)
                }
                console.log(appsFound.toString());
            }             
        })
    })
}

function Init(){
    getMonitorCount()
    getProcessList()
}

function createMainWindow() {
 
    Init()
    mainWindow = new BrowserWindow(
        {
            
            title : ' DeepProctor Exam Browser',
            width : displayList[0].workArea.width/2,
            height : displayList[0].workArea.height/2,
            icon: `${__dirname}/assets/icons/Icon_256x256.png`,
            minimizable : false,
            resizable : false,
            webPreferences: {
                nodeIntegration : true,
                contextIsolation: false
            },
            kiosk:false,
            frame:true
            
        }

    )

    //auto-updater
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });

     //mainWindow.webContents.toggleDevTools();

    //mainWindow.loadFile(`./app/index.html`)
    mainWindow.loadURL(`http://deepproctorbrowser.s3-website.us-east-2.amazonaws.com/`)

    mainWindow.on('focus', () => {
        // Do your required stuff, when the window is focused
        console.log('focus');
    }); 

}

autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
    });

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

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
                        mainWindow.frame = false
                        //mainWindow.maximize()
                        mainWindow.kiosk = true

                        mainWindow.on('blur', () => {
                            // Do your required stuff, when the window loose the focus
                             showQuitMessage()
                        });                   
                        const timer = setInterval(function A() {
                            // dialog.showMessageBox(mainWindow, {message:"Test"}).then(() => app.quit())
                            Validate()
                            Init()
                        }, 10000);
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

function Validate(){

    let message = '';

    console.log('validating....');

    if(displayList.length > 1){
        message = 'Multiple monitors detected. Exam is being terminated.'
        dialog.showMessageBox(mainWindow, {message:message, title: "Exam Violation"}).then(() => app.quit())
    }

    if(appsFound.length > 0){
        console.log(appsFound[0]);
        message = `Following apps were opened while exam was in-progress: ${appsFound.toString()}. Exam is being terminated.`
        dialog.showMessageBox(mainWindow, {message:message, title: "Exam Violation"}).then(() => app.quit())
    }

    
}

function showQuitMessage(){

    if(isCalcInFocus) return

    violationCount++
    const options = {
        buttons: ['Ok'],
        defaultId: 2,
        title: 'Exam Violation - Warning',
        message: (violationCount < 3)?'System detected you were trying to navigate away from the exam. Please go back and continue the exam. Any further activity will cause the exam to be terminated.' : 'Your exam is being terminated immediately'
       
    };
    
    if(violationCount < 3){
        const response = dialog.showMessageBox(mainWindow, options, null);
        response.then(() => {
            console.log('trying to refocus');
           // mainWindow.restore()
           // mainWindow.focus();
            //mainWindow.setKiosk(true);
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
    isCalcInFocus = true
    aboutWindow = new BrowserWindow({
    title: 'Simple Calculator',
    width: 400,
    height: 600,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: false,
    backgroundColor: 'white',
    })

    aboutWindow.on('blur', () => {
        // Do your required stuff, when the window loose the focus
        isCalcInFocus = false
        mainWindow.focus()
    });

    aboutWindow.on('closed', () => {
        isCalcInFocus = false
        console.log('closing focus event');
    })

    aboutWindow.loadFile('./app/calc.html')
}

//.................................subscribed events....................................................
ipcMain.on('url:open', (e,o) => {
    console.log(`Messaeg ${o}`)

    retMessage = "";

    //check if only 1 monitor is connected
    if(getMonitorCount().length > 1){
        retMessage = "Multiple monitors detected. You can only have 1 monitor connected in order to start the exam."
        mainWindow.webContents.send('user:valid', retMessage)
        return
    }

    
    if(appsFound.length > 0){
        retMessage = `Following apps need to be closed before you can proceed : ${appsFound.toString()}`
        mainWindow.webContents.send('user:valid', retMessage)
        getProcessList()
        return
    }


    let urlToOpen = o.url.toString();
    let apiUrl = `${API_URL}${encodeUrl(urlToOpen)}`
    httpGet(apiUrl, o)
    
})

    


// const menu =[ 
//                 {
//                     role:'fileMenu'
//                 }
//             ]

const menu = [
        ...(isMac
        ? [
            {
                label: app.name,
                submenu: [
                {
                    label: 'Calculator',
                    click: createCalcWindow,
                },
                ],
            },
            ]
        : []),
        {
        role: 'fileMenu',
        },
        // ...(!isMac
        // ? [
        //     {
        //         label: 'Tools',
        //         submenu: [
        //         {
        //             label: 'Calculator',
        //             click: createCalcWindow,
        //         },
        //         ],
        //     },
        //     ]
        // : []),
        ...(isDev
        ? [
            {
                label: 'Developer',
                submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { type: 'separator' },
                { role: 'toggledevtools' },
                ],
            },
            ]
        : []),
    ]

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