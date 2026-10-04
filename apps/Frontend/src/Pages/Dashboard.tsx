import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from 'axios'
import { useEffect, useState } from 'react'

const Dashboard = () => {

    type Organization = {
        id: number
        name: string
        description: string
        role: string
    }
    
    const [selectedOrganization, setSelectedOrganization] = useState("")
    const [organization, setOrganization] = useState<Organization[]>([])

    useEffect(() => {
        const getOrganization = async () => {
            const token = localStorage.getItem("token")
            try {
                const response = await axios.get(
                    "http://localhost:3000/api/organization/get-organizations",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                console.log(response.data)
                setOrganization(response.data.organizations)
            } catch (err) {
                console.log("Error ", err)
            }
        }

        getOrganization()
    }, [])

    return (
        <div>
            <h1>Dashboard</h1>
            <div>
                <Select
                    value={selectedOrganization}
                    onValueChange={(value) => {
                        if (value !== null) {
                            setSelectedOrganization(value)
                        }
                    }}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {organization.map((org) => (
                                <SelectItem
                                    key={org.id}
                                    value={String(org.id)}
                                >
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <p>Selected Organization: {selectedOrganization}</p>

            <div>
                <Button>Create Organization</Button>
            </div>


            <Card size="sm" className="mx-auto w-full max-w-xs" >
                <CardTitle>Frontend</CardTitle>
            </Card>
        </div>
    )
}

export default Dashboard