import { api } from "@/api/axios";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { type SyntheticEvent } from "react";

const Organization = () => {

    const [form, setForm] = useState({
        "orgName": "",
        "description": ""
    });

    const handleCreateOrganization = async (
        e: SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        try {

            const { data } = await api.post("/organization", {
                orgName: form.orgName,
                description: form.description
            })
        } catch (error) {
            console.error(error);
        }
    }


    return (
        <div>
            <form onSubmit={handleCreateOrganization}>
                <h1>Organization</h1>

                <Input
                    type="text"
                    placeholder="Enter name of organization to create"
                    value={form.orgName}
                    onChange={(e) => setForm((current) => ({ ...current, orgName: e.target.value }))}
                />

                <Input
                    type="text"
                    placeholder="Enter Description"
                    value={form.description}
                    onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                />
                <Button type="submit">Create Organization</Button>
            </form>
        </div>
    )
}

export default Organization