import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'

import authReducer from '@/store/slices/auth-slice'
import uiReducer from '@/store/slices/ui-slice'

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
})

export const store = configureStore({
  reducer: rootReducer,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()