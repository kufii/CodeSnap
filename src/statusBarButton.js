'use strict'

const vscode = require('vscode')

const createStatusbarButton = () => {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 150)
    item.text = '$(device-camera)'
    item.tooltip = "Snap code"
    item.color = 'inherit'
    item.command = 'codesnap.start'

    let isVisible = false

    return vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor.selection.isEmpty && isVisible) {
            item.hide()
            isVisible = false
        } else if (!isVisible) {
            item.show()
            isVisible = true
        }
    })
}

module.exports = { createStatusbarButton }
