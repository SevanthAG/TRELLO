import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from 'axios'
import { useEffect, useState } from 'react'

const Dashboard = () => {

    const [selectedOrganization, setSelectedOrganization] = useState("")

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
            } catch (err) {
                console.log("Error ", err)
            }
        }

        getOrganization()
    }, [])
    const items = [
        { label: "Apple", value: "apple" },
        { label: "Banana", value: "banana" },
        { label: "Blueberry", value: "blueberry" },
        { label: "Grapes", value: "grapes" },
        { label: "Pineapple", value: "pineapple" },
    ]

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
                            {items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
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