import { GameMode } from '../model/mode'
import { AnyWorkspace } from './workspace'

export class Session {
  private _mode: GameMode | null = null
  private _workspace: AnyWorkspace | null = null

  get mode(): GameMode | null {
    return this._mode
  }

  get workspace(): AnyWorkspace {
    if (this._workspace === null) {
      throw new Error('No active workspace')
    }
    return this._workspace
  }

  enter(mode: GameMode, workspace: AnyWorkspace): void {
    this._mode = mode
    this._workspace = workspace
  }

  returnToMenu(): void {
    this._mode = null
    this._workspace = null
  }

  replaceWorkspace(workspace: AnyWorkspace): void {
    this._workspace = workspace
  }
}
