/** This module manage some public editing board's state, such as edit mode, and
 *  provides some action about it.
 */

import { EDIT_MODE } from '@/utils/enum'

export const editBoardStore = {
  state: {
    editMode: EDIT_MODE.add
  },
  mutations: {
    updateEditMode (state, newEditMode) {
      state.editMode = newEditMode
    }
  },
  actions: {}
}
