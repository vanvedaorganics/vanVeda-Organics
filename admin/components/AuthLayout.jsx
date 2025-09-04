import React, {useEffect, useState} from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export default function Protected({children, authentication = true}) {

const navigate = useNavigate()
const [loader, setLoader] = useState(true)
const authStaus = useSelector(state => state.auth.status)

useEffect(() => {
    if(authentication && authStaus !== authentication){
        navigate('/admin/login')
    }else if(!authentication && authStaus !== authentication) {
        navigate('/admin')
    }
    setLoader(false)
},[authStaus, navigate, authentication]) 


  return loader? <h1>Loading...</h1> : <>{children}</>
}

